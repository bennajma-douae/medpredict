"""
pdf_report.py
-------------
Génère un rapport médical professionnel au format PDF (ReportLab).

Contenu du rapport :
  1. En-tête cabinet médical
  2. Identité & contexte patient (sexe, âge, antécédents)
  3. Observations cliniques (symptômes)
  4. Analyse IA — TOP 3 prédictions avec explication détaillée
  5. Diagnostic retenu par le médecin
  6. Ordonnance médicale saisie par le médecin (médicaments, dose, durée)
  7. Notes cliniques libres
  8. Signature / Pied de page légal
"""

import datetime
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ─── Constantes de couleurs ────────────────────────────────────────────────────
C_NAVY      = colors.HexColor("#1A2B4A")
C_BLUE      = colors.HexColor("#2563EB")
C_BLUE_SOFT = colors.HexColor("#EFF6FF")
C_TEAL      = colors.HexColor("#0D9488")
C_TEAL_SOFT = colors.HexColor("#F0FDFA")
C_AMBER     = colors.HexColor("#D97706")
C_AMBER_SOFT= colors.HexColor("#FFFBEB")
C_RED       = colors.HexColor("#DC2626")
C_RED_SOFT  = colors.HexColor("#FEF2F2")
C_GRAY_DARK = colors.HexColor("#374151")
C_GRAY_MID  = colors.HexColor("#6B7280")
C_GRAY_LIGHT= colors.HexColor("#F3F4F6")
C_GRAY_LINE = colors.HexColor("#E5E7EB")
C_WHITE     = colors.white

REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)


# ─── Utilitaire styles ─────────────────────────────────────────────────────────

def _build_styles() -> dict:
    base = getSampleStyleSheet()
    styles = {}

    def add(name, **kwargs):
        styles[name] = ParagraphStyle(name, parent=base["Normal"], **kwargs)

    add("clinic_name",    fontSize=16, fontName="Helvetica-Bold", textColor=C_NAVY,  alignment=TA_LEFT,  spaceAfter=1)
    add("clinic_sub",     fontSize=8,  fontName="Helvetica",      textColor=C_GRAY_MID, alignment=TA_LEFT)
    add("ref_right",      fontSize=8,  fontName="Helvetica",      textColor=C_GRAY_MID, alignment=TA_RIGHT)
    add("section_title",  fontSize=10, fontName="Helvetica-Bold", textColor=C_NAVY,  spaceBefore=10, spaceAfter=4, borderPad=2)
    add("label",          fontSize=8,  fontName="Helvetica-Bold", textColor=C_GRAY_MID)
    add("value",          fontSize=9,  fontName="Helvetica",      textColor=C_GRAY_DARK)
    add("value_bold",     fontSize=9,  fontName="Helvetica-Bold", textColor=C_NAVY)
    add("disclaimer",     fontSize=7,  fontName="Helvetica-Oblique", textColor=C_GRAY_MID, alignment=TA_CENTER)
    add("rank_disease",   fontSize=11, fontName="Helvetica-Bold", textColor=C_NAVY)
    add("rank_pct",       fontSize=13, fontName="Helvetica-Bold", textColor=C_BLUE)
    add("expl_label",     fontSize=7,  fontName="Helvetica-Bold", textColor=C_GRAY_MID)
    add("expl_value",     fontSize=8,  fontName="Helvetica",      textColor=C_GRAY_DARK)
    add("presc_drug",     fontSize=9,  fontName="Helvetica-Bold", textColor=C_NAVY)
    add("presc_detail",   fontSize=8,  fontName="Helvetica",      textColor=C_GRAY_DARK)
    add("notes_text",     fontSize=9,  fontName="Helvetica-Oblique", textColor=C_GRAY_DARK)
    add("report_title",   fontSize=18, fontName="Helvetica-Bold", textColor=C_WHITE,   alignment=TA_CENTER)
    add("body_small",     fontSize=8,  fontName="Helvetica",      textColor=C_GRAY_DARK)

    return styles


# ─── Utilitaires de mise en page ───────────────────────────────────────────────

def _hr(color=C_GRAY_LINE, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceBefore=4, spaceAfter=4)


def _section_header(title: str, styles: dict) -> list:
    """Retourne un titre de section avec ligne colorée en dessous."""
    return [
        Paragraph(f"■ {title.upper()}", styles["section_title"]),
        _hr(C_BLUE, 1),
    ]


def _info_row(label: str, value: str, styles: dict, w_label=4.5) -> Table:
    """Ligne label / valeur en deux colonnes."""
    data = [[Paragraph(label, styles["label"]),
             Paragraph(value or "—", styles["value"])]]
    t = Table(data, colWidths=[w_label * cm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


# ─── Bloc prédiction IA ────────────────────────────────────────────────────────

def _prediction_block(pred: dict, rank: int, styles: dict,
                       is_selected: bool = False) -> Table:
    """
    Génère un bloc visuel pour une prédiction IA :
      - Rang + nom de la maladie + barre de confiance
      - Explication : symptômes clés, influence sexe, antécédents, delta score
    """
    bg       = C_BLUE_SOFT if is_selected else C_GRAY_LIGHT
    border_c = C_BLUE      if is_selected else C_GRAY_LINE
    rank_labels = {1: "1ᵉʳ", 2: "2ᵉ", 3: "3ᵉ"}
    rank_str    = rank_labels.get(rank, f"{rank}ᵉ")

    expl = pred.get("explanation", {})
    key_symptoms = ", ".join(s.replace("_", " ") for s in expl.get("key_symptoms", []))

    # ── Barre de confiance (canvas dessinée via table de largeur proportionnelle) ──
    conf      = pred.get("confidence", 0)
    conf_pct  = pred.get("confidence_pct", "—")
    raw_conf  = pred.get("raw_confidence", conf)

    selected_badge = (
        "  [✔ RETENU PAR LE MÉDECIN]" if is_selected else ""
    )

    # Cellule principale
    main_cell = [
        Paragraph(
            f"<b>{rank_str} — {pred['disease']}</b>{selected_badge}",
            styles["rank_disease"]
        ),
        Paragraph(conf_pct, styles["rank_pct"]),
        Spacer(1, 4),
        Paragraph("Symptômes clés :", styles["expl_label"]),
        Paragraph(key_symptoms or "—", styles["expl_value"]),
        Spacer(1, 3),
        Paragraph("Influence du sexe :", styles["expl_label"]),
        Paragraph(expl.get("sex_influence", "—"), styles["expl_value"]),
        Spacer(1, 3),
        Paragraph("Influence des antécédents :", styles["expl_label"]),
        Paragraph(expl.get("history_influence", "—"), styles["expl_value"]),
        Spacer(1, 3),
        Paragraph("Ajustement clinique :", styles["expl_label"]),
        Paragraph(expl.get("score_delta_pct", "—"), styles["expl_value"]),
    ]

    data = [[main_cell]]
    t = Table(data, colWidths=[17.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), bg),
        ("BOX",          (0, 0), (-1, -1), 1.5 if is_selected else 0.5, border_c),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    return t


# ─── Bloc ordonnance ───────────────────────────────────────────────────────────

def _prescription_table(medications: list[dict], styles: dict) -> Table:
    """
    medications est une liste de dicts :
      { "name": str, "dosage": str, "frequency": str, "duration": str, "route": str }
    """
    header = [
        Paragraph("Médicament", styles["label"]),
        Paragraph("Dosage",     styles["label"]),
        Paragraph("Fréquence",  styles["label"]),
        Paragraph("Durée",      styles["label"]),
        Paragraph("Voie",       styles["label"]),
    ]

    rows = [header]
    for i, med in enumerate(medications):
        row = [
            Paragraph(med.get("name",      "—"), styles["presc_drug"] if i == 0 else styles["presc_detail"]),
            Paragraph(med.get("dosage",    "—"), styles["presc_detail"]),
            Paragraph(med.get("frequency", "—"), styles["presc_detail"]),
            Paragraph(med.get("duration",  "—"), styles["presc_detail"]),
            Paragraph(med.get("route",     "—"), styles["presc_detail"]),
        ]
        rows.append(row)

    col_w = [5.5 * cm, 3 * cm, 3.5 * cm, 2.5 * cm, 3 * cm]
    t = Table(rows, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        # En-tête
        ("BACKGROUND",    (0, 0), (-1, 0), C_NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), C_WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 8),
        # Corps
        ("FONTSIZE",      (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [C_WHITE, C_GRAY_LIGHT]),
        ("GRID",          (0, 0), (-1, -1), 0.3, C_GRAY_LINE),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ]))
    return t


# ─── Pied de page ──────────────────────────────────────────────────────────────

def _footer_func(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.setFillColor(C_GRAY_MID)
    canvas.setStrokeColor(C_GRAY_LINE)
    canvas.line(1.5 * cm, 1.5 * cm, 19.5 * cm, 1.5 * cm)

    note = (
        "Document généré par MedPredict IA — Outil d'aide au diagnostic. "
        "Ne remplace pas le jugement clinique du médecin traitant. "
        "Le médecin reste seul responsable du diagnostic et de la prescription."
    )
    canvas.drawString(1.5 * cm, 1.0 * cm, note)
    canvas.drawRightString(19.5 * cm, 1.0 * cm, f"Page {doc.page}")
    canvas.restoreState()


# ─── Générateur principal ──────────────────────────────────────────────────────

def generate_report(
    patient:          dict,
    selected_disease: str,
    symptoms:         list[str],
    ai_result:        dict,
    consult_id:       str,
    doctor_notes:     str = "",
    medications:      list[dict] | None = None,
    clinic_info:      dict | None = None,
    exclude_ai:       bool = False,
) -> str:
    """
    Génère le rapport PDF complet ou uniquement l'ordonnance patient (sans IA).

    Args:
        patient          : { name, age, gender, medical_history: [] }
        selected_disease : diagnostic retenu par le médecin
        symptoms         : liste de symptômes déclarés
        ai_result        : réponse complète du /predict endpoint
        consult_id       : identifiant unique de la consultation
        doctor_notes     : observations libres du médecin
        medications      : liste de dicts { name, dosage, frequency, duration, route }
        clinic_info      : { name, address, phone, email } — infos du cabinet
        exclude_ai       : si True, masque l'analyse IA et change le titre pour Ordonnance

    Returns:
        Chemin du fichier PDF généré.
    """
    medications = medications or []
    clinic_info = clinic_info or {
        "name":    "CENTRE MÉDICAL MEDPREDICT",
        "address": "Casablanca, Maroc",
        "phone":   "+212 5XX-XXXXXX",
        "email":   "contact@medpredict.ma",
    }

    suffix = "_ordonnance" if exclude_ai else ""
    filename = f"rapport_consultation_{consult_id}{suffix}.pdf"
    path     = str(REPORTS_DIR / filename)

    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2.2 * cm,
    )

    styles   = _build_styles()
    elements = []

    # ══════════════════════════════════════════════════════════════════
    # 1. EN-TÊTE
    # ══════════════════════════════════════════════════════════════════
    header_left = [
        Paragraph(f"<b>{clinic_info['name']}</b>",   styles["clinic_name"]),
        Paragraph(clinic_info["address"],             styles["clinic_sub"]),
        Paragraph(f"Tél : {clinic_info['phone']}",    styles["clinic_sub"]),
        Paragraph(f"Email : {clinic_info['email']}",  styles["clinic_sub"]),
    ]
    header_right = [
        Paragraph(f"<b>Réf :</b> {consult_id}",                       styles["ref_right"]),
        Paragraph(f"<b>Date :</b> {datetime.date.today().strftime('%d/%m/%Y')}", styles["ref_right"]),
        Paragraph(f"<b>Heure :</b> {datetime.datetime.now().strftime('%H:%M')}", styles["ref_right"]),
    ]

    header_t = Table(
        [[header_left, header_right]],
        colWidths=[12 * cm, 6 * cm],
    )
    header_t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(header_t)

    # Bandeau titre
    elements.append(Spacer(1, 6))
    title_text = "ORDONNANCE MÉDICALE" if exclude_ai else "COMPTE-RENDU DE CONSULTATION MÉDICALE"
    title_t = Table(
        [[Paragraph(title_text, styles["report_title"])]],
        colWidths=[17.5 * cm],
    )
    title_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_NAVY),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [4]),
    ]))
    elements.append(title_t)
    elements.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════
    # 2. INFORMATIONS PATIENT
    # ══════════════════════════════════════════════════════════════════
    elements += _section_header("Informations Patient", styles)

    gender_label = {"M": "Masculin", "F": "Féminin"}.get(
        patient.get("gender", ""), patient.get("gender", "—")
    )
    history = patient.get("medical_history", [])
    history_str = ", ".join(history) if history else "Aucun antécédent déclaré"
    context = ai_result.get("patient_context", {})

    patient_data = [
        [_info_row("Nom complet :",      patient.get("name", "—").upper(), styles),
         _info_row("Âge :",              f"{patient.get('age', '—')} ans", styles)],
        [_info_row("Sexe :",             gender_label, styles),
         _info_row("Antécédents :",      history_str, styles)],
    ]
    pt = Table(patient_data, colWidths=[9 * cm, 8.5 * cm])
    pt.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND",    (0, 0), (-1, -1), C_GRAY_LIGHT),
        ("BOX",           (0, 0), (-1, -1), 0.5, C_GRAY_LINE),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    elements.append(pt)
    elements.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════
    # 3. SYMPTÔMES & 4. ANALYSE IA (uniquement si exclude_ai est False)
    # ══════════════════════════════════════════════════════════════════
    if not exclude_ai:
        elements += _section_header("Observations Cliniques — Symptômes Déclarés", styles)

        recognized   = ai_result.get("symptoms_recognized", [])
        unrecognized = ai_result.get("symptoms_unknown",    [])

        symp_str  = "  •  ".join(s.replace("_", " ").capitalize() for s in recognized) or "—"
        unkn_str  = "  •  ".join(s.replace("_", " ") for s in unrecognized) or "—"

        symp_data = [
            [Paragraph("Symptômes reconnus :", styles["label"]),
             Paragraph(symp_str, styles["value"])],
            [Paragraph("Symptômes non reconnus :", styles["label"]),
             Paragraph(unkn_str, styles["body_small"])],
            [Paragraph("Symptômes analysés :", styles["label"]),
             Paragraph(str(ai_result.get("n_recognized", 0)), styles["value"])],
        ]
        st = Table(symp_data, colWidths=[4.5 * cm, 13 * cm])
        st.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ]))
        elements.append(st)
        elements.append(Spacer(1, 10))

        # ══════════════════════════════════════════════════════════════════
        # 4. ANALYSE IA — TOP 3 PRÉDICTIONS
        # ══════════════════════════════════════════════════════════════════
        elements += _section_header("Analyse IA — Prédictions & Explications", styles)

        model_acc = ai_result.get("model_accuracy")
        trained   = ai_result.get("model_trained_at", "—")
        if model_acc is not None:
            acc_txt = f"Précision du modèle : {model_acc * 100:.1f}%   |   Entraîné le : {trained[:10] if trained else '—'}"
            elements.append(Paragraph(acc_txt, styles["body_small"]))
            elements.append(Spacer(1, 4))

        predictions = ai_result.get("predictions", [])
        for pred in predictions:
            is_sel = pred["disease"].strip().lower() == selected_disease.strip().lower()
            elements.append(_prediction_block(pred, pred["rank"], styles, is_sel))
            elements.append(Spacer(1, 5))

        elements.append(Spacer(1, 6))

    # ══════════════════════════════════════════════════════════════════
    # 5. DIAGNOSTIC RETENU
    # ══════════════════════════════════════════════════════════════════
    elements += _section_header("Diagnostic Médical Retenu", styles)

    diag_t = Table(
        [[Paragraph(f"Pathologie : <b>{selected_disease}</b>", styles["value_bold"])]],
        colWidths=[17.5 * cm],
    )
    diag_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_TEAL_SOFT),
        ("BOX",           (0, 0), (-1, -1), 1.5,  C_TEAL),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(diag_t)
    elements.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════
    # 6. ORDONNANCE
    # ══════════════════════════════════════════════════════════════════
    elements += _section_header("Ordonnance Médicale", styles)

    if medications:
        elements.append(_prescription_table(medications, styles))
    else:
        no_presc = Table(
            [[Paragraph("Aucun médicament prescrit.", styles["value"])]],
            colWidths=[17.5 * cm],
        )
        no_presc.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), C_AMBER_SOFT),
            ("BOX",           (0, 0), (-1, -1), 0.5, C_AMBER),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(no_presc)

    elements.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════
    # 7. NOTES CLINIQUES LIBRES
    # ══════════════════════════════════════════════════════════════════
    if doctor_notes and doctor_notes.strip():
        elements += _section_header("Notes & Observations du Médecin", styles)
        notes_t = Table(
            [[Paragraph(doctor_notes.replace("\n", "<br/>"), styles["notes_text"])]],
            colWidths=[17.5 * cm],
        )
        notes_t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), C_GRAY_LIGHT),
            ("BOX",           (0, 0), (-1, -1), 0.5, C_GRAY_LINE),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(notes_t)
        elements.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════
    # 8. SIGNATURE
    # ══════════════════════════════════════════════════════════════════
    elements += _section_header("Signature & Validation", styles)

    sig_t = Table(
        [[
            "",
            Paragraph(
                f"Fait à {clinic_info['address'].split(',')[0]}, "
                f"le {datetime.date.today().strftime('%d/%m/%Y')}<br/><br/>"
                "<b>Cachet et Signature du Médecin</b><br/><br/><br/><br/>",
                styles["value"]
            )
        ]],
        colWidths=[10 * cm, 7.5 * cm],
    )
    sig_t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(sig_t)

    # Mention légale inline
    elements.append(Spacer(1, 6))
    elements.append(_hr(C_GRAY_LINE))
    elements.append(
        Paragraph(
            "Ce document est une aide au diagnostic générée par MedPredict IA et validée cliniquement par le médecin. "
            "Il ne saurait se substituer à un avis médical complet.",
            styles["disclaimer"]
        )
    )

    # ── Construction finale ──
    doc.build(elements, onFirstPage=_footer_func, onLaterPages=_footer_func)

    return path


# ─── Alias de compatibilité avec routes.py ────────────────────────────────────
generate_professional_pdf = generate_report