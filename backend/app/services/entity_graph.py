"""Entity graph intelligence: modeling relationships between projects, contractors, and agencies."""

import json
from sqlalchemy.orm import Session
from collections import defaultdict

from app.db.models import Project, RiskAssessment
from app.db.v3_models import EntityNode, EntityEdge


def build_entity_graph(db: Session):
    """Rebuilds the entire entity graph from current project data."""
    # Clear existing graph
    db.query(EntityEdge).delete()
    db.query(EntityNode).delete()
    db.commit()

    projects = db.query(Project).all()
    if not projects:
        return

    # Track nodes to avoid duplicates
    # Dicts mapping name -> EntityNode
    agency_nodes = {}
    contractor_nodes = {}
    project_nodes = {}

    # 1. Create Nodes
    for p in projects:
        # Create Project Node
        pn = EntityNode(
            entity_type="project",
            entity_name=p.project_id,
            entity_ref=p.project_id,
            total_linked_projects=1,
            avg_risk_score=p.risk_assessment.risk_score if p.risk_assessment else 0.0,
            max_risk_score=p.risk_assessment.risk_score if p.risk_assessment else 0.0,
            flagged_project_count=1 if (p.risk_assessment and p.risk_assessment.risk_score > 60) else 0
        )
        db.add(pn)
        project_nodes[p.project_id] = pn

        # Create/Update Agency Node
        if p.agency not in agency_nodes:
            an = EntityNode(entity_type="agency", entity_name=p.agency)
            db.add(an)
            agency_nodes[p.agency] = an
            
        # Create/Update Contractor Node
        if p.contractor not in contractor_nodes:
            cn = EntityNode(entity_type="contractor", entity_name=p.contractor)
            db.add(cn)
            contractor_nodes[p.contractor] = cn

    db.commit() # Commit to get IDs

    # Update aggregate stats for Agencies and Contractors
    agency_stats = defaultdict(lambda: {"total": 0, "flagged": 0, "scores": []})
    contractor_stats = defaultdict(lambda: {"total": 0, "flagged": 0, "scores": []})

    for p in projects:
        score = p.risk_assessment.risk_score if p.risk_assessment else 0.0
        is_flagged = score > 60
        
        a_stats = agency_stats[p.agency]
        a_stats["total"] += 1
        a_stats["scores"].append(score)
        if is_flagged: a_stats["flagged"] += 1
            
        c_stats = contractor_stats[p.contractor]
        c_stats["total"] += 1
        c_stats["scores"].append(score)
        if is_flagged: c_stats["flagged"] += 1

    for name, node in agency_nodes.items():
        stats = agency_stats[name]
        node.total_linked_projects = stats["total"]
        node.flagged_project_count = stats["flagged"]
        node.avg_risk_score = round(sum(stats["scores"]) / len(stats["scores"]), 2) if stats["scores"] else 0.0
        node.max_risk_score = max(stats["scores"]) if stats["scores"] else 0.0

    for name, node in contractor_nodes.items():
        stats = contractor_stats[name]
        node.total_linked_projects = stats["total"]
        node.flagged_project_count = stats["flagged"]
        node.avg_risk_score = round(sum(stats["scores"]) / len(stats["scores"]), 2) if stats["scores"] else 0.0
        node.max_risk_score = max(stats["scores"]) if stats["scores"] else 0.0

    # 2. Create Edges
    for p in projects:
        p_node = project_nodes[p.project_id]
        a_node = agency_nodes[p.agency]
        c_node = contractor_nodes[p.contractor]

        # Project -> Agency
        db.add(EntityEdge(source_id=p_node.id, target_id=a_node.id, relationship_type="executed_by"))
        # Project -> Contractor
        db.add(EntityEdge(source_id=p_node.id, target_id=c_node.id, relationship_type="contracted_to"))

    # Find project-project similarities from risk assessments
    for p in projects:
        ra = p.risk_assessment
        if not ra or not ra.similarity_details:
            continue
            
        try:
            sim_details = json.loads(ra.similarity_details)
            for sim in sim_details:
                target_id = sim.get("project_id")
                match_str = sim.get("match_strength", 0)
                if target_id in project_nodes and match_str > 50:
                    t_node = project_nodes[target_id]
                    # Project -> Project (Similarity)
                    db.add(EntityEdge(
                        source_id=project_nodes[p.project_id].id, 
                        target_id=t_node.id, 
                        relationship_type="similar_to",
                        weight=match_str / 100.0,
                        details=json.dumps(sim.get("signals", []))
                    ))
        except:
            pass

    db.commit()
    return {"nodes": len(project_nodes) + len(agency_nodes) + len(contractor_nodes), "edges": db.query(EntityEdge).count()}


def get_full_network(db: Session) -> dict:
    """Returns the full graph for visualization."""
    nodes = db.query(EntityNode).all()
    edges = db.query(EntityEdge).all()

    node_data = []
    for n in nodes:
        node_data.append({
            "id": n.id,
            "type": n.entity_type,
            "label": n.entity_name,
            "ref": n.entity_ref,
            "avg_risk": n.avg_risk_score,
            "max_risk": n.max_risk_score,
            "flagged_count": n.flagged_project_count,
            "total_count": n.total_linked_projects
        })

    edge_data = []
    for e in edges:
        edge_data.append({
            "source": e.source_id,
            "target": e.target_id,
            "type": e.relationship_type,
            "weight": e.weight,
            "details": json.loads(e.details) if e.details else []
        })

    return {"nodes": node_data, "links": edge_data}


def get_entity_clusters(db: Session) -> list[dict]:
    """Find contractors/agencies with a high concentration of flagged projects."""
    suspicious_nodes = (
        db.query(EntityNode)
        .filter(EntityNode.entity_type.in_(["contractor", "agency"]))
        .filter(EntityNode.flagged_project_count >= 2)
        .order_by(EntityNode.flagged_project_count.desc())
        .limit(10)
        .all()
    )

    clusters = []
    for n in suspicious_nodes:
        clusters.append({
            "entity_name": n.entity_name,
            "entity_type": n.entity_type,
            "total_projects": n.total_linked_projects,
            "flagged_projects": n.flagged_project_count,
            "avg_risk": n.avg_risk_score,
            "max_risk": n.max_risk_score,
            "emergent_risk_score": min(100.0, (n.flagged_project_count / n.total_linked_projects) * 100.0 + (n.flagged_project_count * 5))
        })
        
    return clusters
