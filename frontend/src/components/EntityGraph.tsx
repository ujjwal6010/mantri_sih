import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { fetchEntityGraph } from '../services/api';
import type { EntityNode } from '../types/project';

interface SimulationNode extends EntityNode, d3.SimulationNodeDatum {}
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  type: string;
  weight: number;
}

export const EntityGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let simulation: d3.Simulation<SimulationNode, undefined>;

    const loadGraph = async () => {
      try {
        const data = await fetchEntityGraph();
        if (!data || !data.nodes || data.nodes.length === 0) {
          setLoading(false);
          return;
        }

        const width = containerRef.current?.clientWidth || 800;
        const height = 400;

        const nodes: SimulationNode[] = data.nodes.map(n => ({ ...n }));
        const links: SimulationLink[] = data.links.map(l => ({
          source: l.source,
          target: l.target,
          type: l.type,
          weight: l.weight
        }));

        const svg = d3.select(svgRef.current)
          .attr('width', width)
          .attr('height', height);

        svg.selectAll('*').remove();

        // Colors
        const colorMap = {
          project: '#818cf8',
          contractor: '#f472b6',
          agency: '#34d399'
        };

        // Add container for zoom/pan
        const g = svg.append('g');

        // Zoom setup
        const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });
        svg.call(zoom as any);

        // Simulation setup
        simulation = d3.forceSimulation<SimulationNode>(nodes)
          .force('link', d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).distance(60))
          .force('charge', d3.forceManyBody().strength(-150))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collide', d3.forceCollide().radius(20));

        // Links
        const link = g.append('g')
          .selectAll('line')
          .data(links)
          .join('line')
          .attr('stroke', '#4b5563')
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', d => Math.max(1, d.weight * 2))
          .attr('stroke-dasharray', d => d.type === 'similar_to' ? '4,4' : 'none');

        // Nodes
        const node = g.append('g')
          .selectAll('circle')
          .data(nodes)
          .join('circle')
          .attr('r', d => d.type === 'project' ? 8 : (d.flagged_count > 0 ? 16 : 12))
          .attr('fill', d => colorMap[d.type])
          .attr('stroke', d => (d.flagged_count > 0 || d.max_risk > 60) ? '#ef4444' : '#1e1e2d')
          .attr('stroke-width', d => (d.flagged_count > 0 || d.max_risk > 60) ? 3 : 1.5)
          .call(d3.drag<SVGCircleElement, SimulationNode>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended) as any
          );

        // Labels
        const label = g.append('g')
          .selectAll('text')
          .data(nodes)
          .join('text')
          .text(d => d.label)
          .attr('font-size', '10px')
          .attr('fill', '#9ca3af')
          .attr('dx', 15)
          .attr('dy', 4);

        // Title tooltips
        node.append('title')
          .text(d => `${d.label} (${d.type})\nRisk: ${d.max_risk.toFixed(1)}${d.type !== 'project' ? `\nProjects: ${d.total_count}\nFlagged: ${d.flagged_count}` : ''}`);

        // Tick
        simulation.on('tick', () => {
          link
            .attr('x1', d => (d.source as SimulationNode).x!)
            .attr('y1', d => (d.source as SimulationNode).y!)
            .attr('x2', d => (d.target as SimulationNode).x!)
            .attr('y2', d => (d.target as SimulationNode).y!);

          node
            .attr('cx', d => d.x!)
            .attr('cy', d => d.y!);

          label
            .attr('x', d => d.x!)
            .attr('y', d => d.y!);
        });

        // Drag functions
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to load entity graph", err);
        setLoading(false);
      }
    };

    loadGraph();

    return () => {
      if (simulation) simulation.stop();
    };
  }, []);

  return (
    <div className="entity-graph-container" ref={containerRef}>
      <div className="entity-graph-header">
        <h4>Cross-Project Intelligence Network</h4>
        <div className="entity-graph-legend">
          <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#818cf8'}}></span> Projects</span>
          <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#f472b6'}}></span> Contractors</span>
          <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#34d399'}}></span> Agencies</span>
          <span className="legend-item"><span className="legend-dot legend-stroke"></span> High Risk / Flagged</span>
        </div>
      </div>
      
      {loading ? (
        <div className="entity-graph-loading">Analyzing network...</div>
      ) : (
        <svg ref={svgRef} className="entity-graph-svg"></svg>
      )}
    </div>
  );
};
