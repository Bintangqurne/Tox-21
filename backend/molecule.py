"""Validasi SMILES, rendering struktur 2D ke SVG, dan deteksi toxicophore via RDKit."""
from rdkit import Chem
from rdkit.Chem.Draw import rdMolDraw2D
from rdkit.Chem import rdMolDescriptors

# ─── Toxicophore SMARTS dictionary ────────────────────────────────────────────
# Sumber: Kazius et al. (2005) "Derivation and Validation of Toxicophores for
# Mutagenicity Prediction" + Bender SOM database + EPA structural alerts.
# Ditulis dalam RDKit SMARTS syntax.

TOXICOPHORE_SMARTS: dict[str, str] = {
    "Michael Acceptor":         "[CX3]=[CX3]-[CX3]=[OX1]",
    "Nitro Aromatik":           "[$([N+](=O)[O-])]-c",
    "Amina Aromatik (Anilin)":  "[NH2]-c",
    "Epoksida":                 "C1OC1",
    "Aldehid":                  "[CX3H1](=O)[#6]",
    "Kuinon":                   "[#6]1(=O)-[#6]=[#6]-[#6](=O)-[#6]=[#6]-1",
    "Nitroso":                  "[N;X2]=[O;X1]",
    "Azo (-N=N-)":              "[N;X2]=[N;X2]",
    "Aril Halida":              "c[F,Cl,Br,I]",
    "Hidrazin":                 "[NH]-[NH2]",
    "Imina reaktif (Schiff)":   "[CX3H1]=[NX2]",
    "Karbamat (reaktif)":       "[#7]-C(=O)-[O]-[#6]",
}

# Warna highlight per toxicophore (R, G, B) dalam float 0-1
# Warna merah-oranye menunjukkan reaktivitas/mutagenisitas
TOXICOPHORE_COLORS: dict[str, tuple[float, float, float]] = {
    "Michael Acceptor":         (1.0, 0.35, 0.2),
    "Nitro Aromatik":           (1.0, 0.5, 0.1),
    "Amina Aromatik (Anilin)":  (0.9, 0.2, 0.6),
    "Epoksida":                 (1.0, 0.7, 0.0),
    "Aldehid":                  (0.8, 0.4, 0.1),
    "Kuinon":                   (0.6, 0.0, 0.8),
    "Nitroso":                  (1.0, 0.4, 0.4),
    "Azo (-N=N-)":              (0.0, 0.5, 0.9),
    "Aril Halida":              (0.2, 0.7, 0.2),
    "Hidrazin":                 (0.9, 0.1, 0.3),
    "Imina reaktif (Schiff)":   (0.7, 0.5, 0.1),
    "Karbamat (reaktif)":       (0.4, 0.4, 0.9),
}


def parse_smiles(smiles: str):
    """Parse SMILES → RDKit Mol. Return None jika invalid."""
    if not smiles or not smiles.strip():
        return None
    mol = Chem.MolFromSmiles(smiles.strip())
    return mol


def find_toxicophores(smiles: str) -> list[dict]:
    """
    Temukan semua toxicophore yang match di molekul.

    Returns list of:
        {
            "name": str,
            "atom_indices": list[int],
            "bond_indices": list[int],
            "color": [R, G, B]  (float 0-1)
        }
    """
    mol = parse_smiles(smiles)
    if mol is None:
        return []

    results = []
    seen_atoms: set[int] = set()

    for name, smarts in TOXICOPHORE_SMARTS.items():
        try:
            pattern = Chem.MolFromSmarts(smarts)
            if pattern is None:
                continue
            matches = mol.GetSubstructMatches(pattern)
            if not matches:
                continue

            all_atom_indices: list[int] = []
            all_bond_indices: list[int] = []

            for match in matches:
                atom_indices = list(match)
                all_atom_indices.extend(atom_indices)

                # Tambah bond antara atom yang match
                for i, ai in enumerate(atom_indices):
                    for j in range(i + 1, len(atom_indices)):
                        aj = atom_indices[j]
                        bond = mol.GetBondBetweenAtoms(ai, aj)
                        if bond is not None:
                            all_bond_indices.append(bond.GetIdx())

            if all_atom_indices:
                color = TOXICOPHORE_COLORS.get(name, (1.0, 0.5, 0.0))
                results.append({
                    "name": name,
                    "atom_indices": list(set(all_atom_indices)),
                    "bond_indices": list(set(all_bond_indices)),
                    "color": list(color),
                })
                seen_atoms.update(all_atom_indices)

        except Exception:
            continue  # skip invalid SMARTS

    return results


def render_svg(
    smiles: str,
    width: int = 400,
    height: int = 300,
    highlight_atoms: dict[int, tuple[float, float, float]] | None = None,
    highlight_bonds: dict[int, tuple[float, float, float]] | None = None,
    highlight_radii: dict[int, float] | None = None,
) -> str | None:
    """
    Render struktur molekul 2D ke string SVG.

    Args:
        smiles: string SMILES.
        width, height: dimensi SVG (pixel).
        highlight_atoms: dict {atom_idx: (R, G, B)} warna float 0-1 per atom.
        highlight_bonds: dict {bond_idx: (R, G, B)} warna float 0-1 per bond.
        highlight_radii: dict {atom_idx: radius_float} untuk kontrol ukuran highlight.

    Returns:
        SVG string atau None jika SMILES invalid.
    """
    mol = parse_smiles(smiles)
    if mol is None:
        return None

    drawer = rdMolDraw2D.MolDraw2DSVG(width, height)
    opts = drawer.drawOptions()
    opts.clearBackground = False  # transparent — frontend kontrol background
    opts.addAtomIndices = False

    if highlight_atoms or highlight_bonds:
        # RDKit DrawMolecule signature (2nd form):
        # DrawMolecule(mol, atoms, bonds, atomColors, bondColors, atomRadii)
        # Colors passed as dict of {idx: (R, G, B)} tuples (float 0-1)
        atom_list = list(highlight_atoms.keys()) if highlight_atoms else []
        bond_list = list(highlight_bonds.keys()) if highlight_bonds else []
        a_colors = dict(highlight_atoms) if highlight_atoms else {}
        b_colors = dict(highlight_bonds) if highlight_bonds else {}
        radii = highlight_radii or {}

        drawer.DrawMolecule(mol, atom_list, bond_list, a_colors, b_colors, radii)
    else:
        drawer.DrawMolecule(mol)

    drawer.FinishDrawing()
    return drawer.GetDrawingText()
