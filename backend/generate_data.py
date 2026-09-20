"""Synthetic MPLADS dataset generator."""

import csv
import random
import os
from datetime import date, timedelta
from pathlib import Path

random.seed(42)

# Reference data

STATES = {
    "Rajasthan": {
        "districts": ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Ajmer"],
        "constituencies": ["Jaipur Rural", "Jodhpur City", "Kota South", "Udaipur East", "Ajmer North"],
        "lat_range": (24.5, 27.5),
        "lon_range": (70.5, 76.5),
    },
    "Maharashtra": {
        "districts": ["Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
        "constituencies": ["Pune Central", "Nagpur South", "Nashik West", "Aurangabad East", "Thane North"],
        "lat_range": (17.5, 21.0),
        "lon_range": (73.0, 79.0),
    },
    "Uttar Pradesh": {
        "districts": ["Lucknow", "Varanasi", "Kanpur", "Agra", "Prayagraj"],
        "constituencies": ["Lucknow East", "Varanasi South", "Kanpur City", "Agra North", "Prayagraj West"],
        "lat_range": (25.0, 28.5),
        "lon_range": (79.0, 84.0),
    },
    "Tamil Nadu": {
        "districts": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
        "constituencies": ["Chennai South", "Coimbatore North", "Madurai Central", "Salem West", "Trichy East"],
        "lat_range": (9.5, 13.5),
        "lon_range": (76.5, 80.5),
    },
    "Karnataka": {
        "districts": ["Bengaluru Urban", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
        "constituencies": ["Bengaluru South", "Mysuru North", "Hubballi Central", "Mangaluru City", "Belagavi West"],
        "lat_range": (12.0, 16.0),
        "lon_range": (74.5, 78.0),
    },
    "Madhya Pradesh": {
        "districts": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
        "constituencies": ["Bhopal North", "Indore Central", "Jabalpur East", "Gwalior South", "Ujjain West"],
        "lat_range": (22.0, 25.5),
        "lon_range": (75.0, 81.0),
    },
}

WORK_TYPES = [
    "Road Construction",
    "Drinking Water Supply",
    "School Building",
    "Community Hall",
    "Drainage System",
    "Public Toilet",
    "Bridge Construction",
    "Street Lighting",
    "Health Sub-Center",
    "Anganwadi Center",
]

DESCRIPTIONS = {
    "Road Construction": [
        "Construction of CC road from main highway to village",
        "Construction of black-top road connecting two habitations",
        "Widening and strengthening of approach road to village",
        "Construction of interlocking paver block road in ward",
    ],
    "Drinking Water Supply": [
        "Installation of hand pump for drinking water supply",
        "Construction of overhead water tank with distribution network",
        "Laying of water supply pipeline to underserved area",
        "Bore well construction and pump installation for community",
    ],
    "School Building": [
        "Construction of additional classroom in primary school",
        "Construction of boundary wall for government school",
        "Construction of toilet block in government school campus",
        "Renovation and repair of government school building",
    ],
    "Community Hall": [
        "Construction of community hall for public gatherings",
        "Construction of panchayat bhawan for community use",
        "Construction of multipurpose community center in village",
        "Renovation of existing community hall with modern amenities",
    ],
    "Drainage System": [
        "Construction of covered drainage along main road",
        "Construction of storm water drain in residential area",
        "Renovation of open drain to covered drain system",
        "Construction of drainage outfall and treatment facility",
    ],
    "Public Toilet": [
        "Construction of public toilet complex near market area",
        "Construction of community toilet block with water supply",
        "Installation of prefabricated toilet units in public space",
        "Construction of toilet facility near bus stand",
    ],
    "Bridge Construction": [
        "Construction of RCC bridge over nallah for connectivity",
        "Construction of culvert on approach road to village",
        "Construction of pedestrian bridge over canal",
        "Widening and strengthening of existing bridge structure",
    ],
    "Street Lighting": [
        "Installation of solar LED street lights in village",
        "Installation of high mast lights at public gathering point",
        "Replacement of conventional lights with solar LED lights",
        "Installation of street lighting along village main road",
    ],
    "Health Sub-Center": [
        "Construction of health sub-center building in village",
        "Renovation of primary health center facility",
        "Construction of additional room in health sub-center",
        "Construction of health wellness center in rural area",
    ],
    "Anganwadi Center": [
        "Construction of anganwadi center for child development",
        "Construction of new anganwadi building with kitchen",
        "Renovation of existing anganwadi center structure",
        "Construction of anganwadi center with compound wall",
    ],
}

AGENCIES = [
    "District Rural Development Agency",
    "Public Works Department",
    "Zila Parishad",
    "Municipal Corporation",
    "State Public Health Engineering Department",
    "Block Development Office",
    "Gram Panchayat",
    "Urban Local Body",
]

CONTRACTORS = [
    "Sharma Construction Co.",
    "Patel & Sons Builders",
    "Singh Infrastructure Pvt. Ltd.",
    "Gupta Civil Works",
    "Reddy Construction",
    "Kumar Builders",
    "Desai Infrastructure",
    "Joshi Engineering Works",
    "Mehta Constructions",
    "Rao & Associates",
    "Verma Civil Projects",
    "Yadav Construction",
    "Mishra Builders",
    "Nair Infrastructure",
    "Pillai Constructions",
]

def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, max(0, delta)))

def jitter_coord(value: float, spread: float = 0.005) -> float:
    return round(value + random.uniform(-spread, spread), 6)

def make_normal_project(idx: int, state: str, info: dict) -> dict:
    """Generate a normal, healthy-looking project."""
    work_type = random.choice(WORK_TYPES)
    district = random.choice(info["districts"])
    constituency = random.choice(info["constituencies"])
    sanctioned = random.choice([500000, 800000, 1000000, 1200000, 1500000, 2000000, 2500000, 3000000])
    released = round(sanctioned * random.uniform(0.70, 1.0))
    start = random_date(date(2023, 1, 1), date(2024, 6, 1))
    duration = random.randint(180, 540)
    completion = start + timedelta(days=duration)
    elapsed = (date(2025, 9, 1) - start).days
    expected_pct = min(100, max(0, (elapsed / duration) * 100))
    # Normal projects: progress roughly tracks expectation
    physical = min(100, max(5, expected_pct + random.uniform(-15, 10)))
    expenditure = round(sanctioned * (physical / 100) * random.uniform(0.8, 1.15))
    lat = round(random.uniform(*info["lat_range"]), 6)
    lon = round(random.uniform(*info["lon_range"]), 6)

    return {
        "project_id": f"MD{idx:03d}",
        "state": state,
        "district": district,
        "constituency": constituency,
        "work_type": work_type,
        "description": random.choice(DESCRIPTIONS[work_type]),
        "sanctioned_amount": sanctioned,
        "released_amount": released,
        "expenditure": expenditure,
        "physical_progress": round(physical, 1),
        "start_date": start.isoformat(),
        "expected_completion": completion.isoformat(),
        "latitude": lat,
        "longitude": lon,
        "agency": random.choice(AGENCIES),
        "contractor": random.choice(CONTRACTORS),
    }

def make_high_expenditure_low_progress(idx: int, state: str, info: dict, contractor: str = None) -> dict:
    """Anomaly: money spent but little progress reported."""
    work_type = random.choice(WORK_TYPES)
    district = random.choice(info["districts"])
    sanctioned = random.choice([1500000, 2000000, 2500000, 3000000, 4000000])
    released = round(sanctioned * random.uniform(0.85, 1.0))
    start = random_date(date(2023, 1, 1), date(2023, 12, 1))
    duration = random.randint(270, 450)
    completion = start + timedelta(days=duration)
    # High expenditure: 70-95% of sanctioned
    expenditure = round(sanctioned * random.uniform(0.70, 0.95))
    # But low progress: 10-35%
    physical = round(random.uniform(10, 35), 1)

    return {
        "project_id": f"MD{idx:03d}",
        "state": state,
        "district": district,
        "constituency": random.choice(info["constituencies"]),
        "work_type": work_type,
        "description": random.choice(DESCRIPTIONS[work_type]),
        "sanctioned_amount": sanctioned,
        "released_amount": released,
        "expenditure": expenditure,
        "physical_progress": physical,
        "start_date": start.isoformat(),
        "expected_completion": completion.isoformat(),
        "latitude": round(random.uniform(*info["lat_range"]), 6),
        "longitude": round(random.uniform(*info["lon_range"]), 6),
        "agency": random.choice(AGENCIES),
        "contractor": contractor or random.choice(CONTRACTORS),
    }

def make_delayed_project(idx: int, state: str, info: dict) -> dict:
    """Anomaly: past expected completion but still incomplete."""
    work_type = random.choice(WORK_TYPES)
    district = random.choice(info["districts"])
    sanctioned = random.choice([800000, 1000000, 1500000, 2000000])
    released = round(sanctioned * random.uniform(0.60, 0.90))
    start = random_date(date(2022, 6, 1), date(2023, 6, 1))
    duration = random.randint(180, 365)
    completion = start + timedelta(days=duration)
    # Physical progress: 40-75% (incomplete)
    physical = round(random.uniform(40, 75), 1)
    expenditure = round(sanctioned * random.uniform(0.40, 0.70))

    return {
        "project_id": f"MD{idx:03d}",
        "state": state,
        "district": district,
        "constituency": random.choice(info["constituencies"]),
        "work_type": work_type,
        "description": random.choice(DESCRIPTIONS[work_type]),
        "sanctioned_amount": sanctioned,
        "released_amount": released,
        "expenditure": expenditure,
        "physical_progress": physical,
        "start_date": start.isoformat(),
        "expected_completion": completion.isoformat(),
        "latitude": round(random.uniform(*info["lat_range"]), 6),
        "longitude": round(random.uniform(*info["lon_range"]), 6),
        "agency": random.choice(AGENCIES),
        "contractor": random.choice(CONTRACTORS),
    }

def make_overlap_pair(idx: int, state: str, info: dict) -> list[dict]:
    """Two projects that look suspiciously similar — same area, similar work, close amounts."""
    work_type = random.choice(["Road Construction", "Drinking Water Supply", "Community Hall"])
    district = random.choice(info["districts"])
    constituency = random.choice(info["constituencies"])
    desc_list = DESCRIPTIONS[work_type]
    base_desc = random.choice(desc_list)
    sanctioned_1 = random.choice([1500000, 2000000, 2500000])
    sanctioned_2 = round(sanctioned_1 * random.uniform(0.90, 1.10))
    start_1 = random_date(date(2023, 6, 1), date(2024, 3, 1))
    start_2 = start_1 + timedelta(days=random.randint(15, 75))
    duration = random.randint(240, 400)
    base_lat = round(random.uniform(*info["lat_range"]), 6)
    base_lon = round(random.uniform(*info["lon_range"]), 6)
    agency = random.choice(AGENCIES)
    contractor = random.choice(CONTRACTORS)

    proj1 = {
        "project_id": f"MD{idx:03d}",
        "state": state,
        "district": district,
        "constituency": constituency,
        "work_type": work_type,
        "description": base_desc,
        "sanctioned_amount": sanctioned_1,
        "released_amount": round(sanctioned_1 * random.uniform(0.80, 1.0)),
        "expenditure": round(sanctioned_1 * random.uniform(0.30, 0.65)),
        "physical_progress": round(random.uniform(25, 60), 1),
        "start_date": start_1.isoformat(),
        "expected_completion": (start_1 + timedelta(days=duration)).isoformat(),
        "latitude": base_lat,
        "longitude": base_lon,
        "agency": agency,
        "contractor": contractor,
    }
    proj2 = {
        "project_id": f"MD{idx + 1:03d}",
        "state": state,
        "district": district,
        "constituency": constituency,
        "work_type": work_type,
        "description": base_desc.replace("construction", "building").replace("Construction", "Development")
                       if "construction" in base_desc.lower() else base_desc + " (Phase 2)",
        "sanctioned_amount": sanctioned_2,
        "released_amount": round(sanctioned_2 * random.uniform(0.80, 1.0)),
        "expenditure": round(sanctioned_2 * random.uniform(0.25, 0.55)),
        "physical_progress": round(random.uniform(20, 55), 1),
        "start_date": start_2.isoformat(),
        "expected_completion": (start_2 + timedelta(days=duration)).isoformat(),
        "latitude": jitter_coord(base_lat, 0.008),   # ~800m away
        "longitude": jitter_coord(base_lon, 0.008),
        "agency": agency,
        "contractor": contractor,
    }
    return [proj1, proj2]

def make_entity_cluster(start_idx: int) -> list[dict]:
    """
    Contractor cluster: same contractor appears across 3–4 projects
    with varying degrees of anomaly.
    """
    contractor = "Apex Infra Solutions"  # Memorable name for demo
    state = "Rajasthan"
    info = STATES[state]
    projects = []

    # Project 1: high expenditure, low progress
    projects.append(make_high_expenditure_low_progress(start_idx, state, info, contractor))
    projects[-1]["district"] = "Kota"

    # Project 2: delayed
    p2 = make_delayed_project(start_idx + 1, state, info)
    p2["contractor"] = contractor
    p2["district"] = "Kota"
    projects.append(p2)

    # Project 3: another financial mismatch
    projects.append(make_high_expenditure_low_progress(start_idx + 2, state, info, contractor))
    projects[-1]["district"] = "Jaipur"

    # Project 4: normal (to show not ALL are bad)
    p4 = make_normal_project(start_idx + 3, state, info)
    p4["contractor"] = contractor
    p4["district"] = "Udaipur"
    projects.append(p4)

    return projects

# Generate the full dataset

def generate_dataset() -> list[dict]:
    projects = []
    idx = 1

    # 1. Entity cluster (4 projects, contractor "Apex Infra Solutions")
    cluster = make_entity_cluster(idx)
    projects.extend(cluster)
    idx += len(cluster)

    # 2. Overlap pairs (3 pairs = 6 projects)
    for state_name in ["Maharashtra", "Tamil Nadu", "Uttar Pradesh"]:
        pair = make_overlap_pair(idx, state_name, STATES[state_name])
        projects.extend(pair)
        idx += 2

    # 3. High expenditure + low progress anomalies (6 projects)
    for state_name in ["Karnataka", "Madhya Pradesh", "Rajasthan",
                        "Maharashtra", "Uttar Pradesh", "Tamil Nadu"]:
        projects.append(make_high_expenditure_low_progress(idx, state_name, STATES[state_name]))
        idx += 1

    # 4. Delayed projects (6 projects)
    for state_name in ["Rajasthan", "Karnataka", "Madhya Pradesh",
                        "Tamil Nadu", "Uttar Pradesh", "Maharashtra"]:
        projects.append(make_delayed_project(idx, state_name, STATES[state_name]))
        idx += 1

    # 5. Normal projects to fill out (remaining to reach ~80)
    states_list = list(STATES.keys())
    while idx <= 80:
        state_name = random.choice(states_list)
        projects.append(make_normal_project(idx, state_name, STATES[state_name]))
        idx += 1

    return projects

def write_csv(projects: list[dict], path: str):
    fieldnames = [
        "project_id", "state", "district", "constituency",
        "work_type", "description",
        "sanctioned_amount", "released_amount", "expenditure",
        "physical_progress",
        "start_date", "expected_completion",
        "latitude", "longitude",
        "agency", "contractor",
    ]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(projects)
    print(f"Generated {len(projects)} projects -> {path}")

if __name__ == "__main__":
    output_path = os.path.join(os.path.dirname(__file__), "data", "sample_projects.csv")
    dataset = generate_dataset()
    write_csv(dataset, output_path)
