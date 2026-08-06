import streamlit as st
import pandas as pd
import datetime
import io
import zipfile
import re
import base64
from sample_generator import generate_sample_excel
from document_builder import (
    create_phieu_duoi_6_doc,
    create_phieu_tren_6_doc,
    create_bien_ban_hop_doc,
    create_thong_bao_niem_yet_doc,
    fill_docx_placeholders
)


def render_download_button(data_bytes, filename, mime_type, label, icon="📥", color="primary"):
    if not data_bytes:
        return
    b64 = base64.b64encode(data_bytes).decode()
    if color == "primary":
        bg_style = "background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff;"
    elif color == "secondary":
        bg_style = "background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;"
    elif color == "success":
        bg_style = "background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff;"
    else:
        bg_style = "background: #2563eb; color: #ffffff;"

    html_code = f'''
    <a href="data:{mime_type};base64,{b64}" download="{filename}" target="_self" style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 10px;
        text-decoration: none !important;
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        transition: all 0.2s ease;
        margin-top: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        box-sizing: border-box;
        {bg_style}
    " onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)';" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)';">
        <span>{icon}</span>
        <span>{label}</span>
    </a>
    '''
    st.markdown(html_code, unsafe_allow_html=True)


def generate_phieu_doc_for_row(row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_lap):
    ho_ten = str(row.get("Họ và tên", row.get("HO_TEN", "Doi_tuong")))
    dob_raw = row.get("Ngày sinh", row.get("NGAY_SINH", ""))
    dob_dt = parse_date_str(dob_raw)
    dob_str = format_date_vn(dob_dt) if dob_dt else str(dob_raw)
    nhom_tuoi = row.get("Nhóm tuổi", "")

    data_dict = {
        "HO_TEN": ho_ten,
        "NGAY_SINH": dob_str,
        "NGAY_SINH_NGAY": str(dob_dt.day).zfill(2) if dob_dt else "",
        "NGAY_SINH_THANG": str(dob_dt.month).zfill(2) if dob_dt else "",
        "NGAY_SINH_NAM": str(dob_dt.year) if dob_dt else "",
        "GIOI_TINH": str(row.get("Giới tính", "Nam")),
        "THON": str(row.get("Thôn", "")),
        "XA": xa,
        "XA_UPPER": xa.upper(),
        "HUYEN": huyen,
        "TINH": tinh,
        "CMND": str(row.get("Số CMND/CCCD", "")),
        "DANG_TAT": str(row.get("Dạng tật", "")),
        "MUC_DO": str(row.get("Mức độ khuyết tật", "")),
        "GHI_CHU": str(row.get("Ghi chú", "")),
        "HO_TEN_NDH": str(row.get("Người đại diện", "")),
        "MOI_QUAN_HE": str(row.get("Mối quan hệ", "")),
        "CMND_NDH": str(row.get("Số CMND/CCCD NDH", "")),
        "SDT_NDH": str(row.get("SĐT người đại diện", "")),
        "NGAY_HOP_NGAY": str(ngay_hop_dt.day).zfill(2),
        "NGAY_HOP_THANG": str(ngay_hop_dt.month).zfill(2),
        "NGAY_HOP_NAM": str(ngay_hop_dt.year),
        "CHU_TICH": chu_tich,
        "NGUOI_LAP": nguoi_lap,
        "TONG_DIEM": str(row.get("Tổng điểm", "12"))
    }

    if nhom_tuoi == "Dưới 6 tuổi":
        doc = create_phieu_duoi_6_doc(data_dict)
        filename = f"Phieu_XDKT_Duoi_6_Tuoi_{sanitize_filename(ho_ten)}.docx"
    else:
        doc = create_phieu_tren_6_doc(data_dict)
        filename = f"Phieu_XDKT_Tu_6_Tuoi_{sanitize_filename(ho_ten)}.docx"

    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    return filename, doc_io.getvalue()


def generate_bien_ban_doc_for_row(row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_ghi, y_te, mttq, gio_hop, phut_hop, dia_diem_hop):
    ho_ten = str(row.get("Họ và tên", row.get("HO_TEN", "Doi_tuong")))
    dob_raw = row.get("Ngày sinh", row.get("NGAY_SINH", ""))
    dob_dt = parse_date_str(dob_raw)
    dob_str = format_date_vn(dob_dt) if dob_dt else str(dob_raw)

    data_dict = {
        "HO_TEN": ho_ten,
        "NGAY_SINH": dob_str,
        "GIOI_TINH": str(row.get("Giới tính", "Nam")),
        "THON": str(row.get("Thôn", "")),
        "XA": xa,
        "XA_UPPER": xa.upper(),
        "HUYEN": huyen,
        "TINH": tinh,
        "DANG_TAT": str(row.get("Dạng tật", "")),
        "MUC_DO": str(row.get("Mức độ khuyết tật", "")),
        "GHI_CHU": str(row.get("Ghi chú", "Thống nhất 100%")),
        "GIO_HOP": str(gio_hop),
        "PHUT_HOP": str(phut_hop),
        "DIA_DIEM_HOP": str(dia_diem_hop),
        "NGAY_HOP_NGAY": str(ngay_hop_dt.day).zfill(2),
        "NGAY_HOP_THANG": str(ngay_hop_dt.month).zfill(2),
        "NGAY_HOP_NAM": str(ngay_hop_dt.year),
        "GIO_KET_THUC": str(int(gio_hop) + 2 if str(gio_hop).isdigit() else "10"),
        "CHU_TICH": chu_tich,
        "Y_TE": y_te,
        "MTTQ": mttq,
        "NGUOI_GHI_BIEN_BAN": nguoi_ghi
    }

    doc = create_bien_ban_hop_doc(data_dict)
    filename = f"Bien_Ban_Hop_Hoi_Dong_{sanitize_filename(ho_ten)}.docx"

    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    return filename, doc_io.getvalue()


# Set page configuration
st.set_page_config(
    page_title="Xác Định Mức Độ Khuyết Tật",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom Styling for "Clean Utility / Minimal" Portal Design Theme
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    /* Global typography & slate canvas */
    html, body, p, h1, h2, h3, h4, h5, h6, input, button, select, textarea, label {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }

    /* Preserve Icon Fonts for Streamlit UI icons (sidebar collapse, uploader icon, etc.) */
    span[data-testid="stIcon"],
    button[data-testid="stSidebarCollapseButton"] *,
    button[aria-label*="sidebar"] *,
    [data-testid="stSidebarCollapseButton"] span,
    section[data-testid="stFileUploadDropzone"] span[data-testid="stIcon"],
    [class*="material-symbols"],
    [class*="material-icons"] {
        font-family: 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Icons' !important;
    }
    
    .stApp {
        background-color: #f8fafc !important;
        color: #0f172a !important;
    }

    /* Hide Streamlit Sidebar & Top Header Bar completely */
    [data-testid="stSidebar"],
    section[data-testid="stSidebar"],
    button[data-testid="stSidebarCollapseButton"],
    [data-testid="stSidebarNav"],
    header[data-testid="stHeader"],
    div[data-testid="stHeader"],
    [data-testid="stToolbar"],
    [data-testid="stDecoration"],
    .stAppHeader {
        display: none !important;
        height: 0 !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    /* Main app layout reset to eliminate top/side whitespace */
    .stApp,
    [data-testid="stAppViewContainer"],
    [data-testid="stMain"],
    section.main {
        padding-top: 0 !important;
        margin-top: 0 !important;
    }

    /* Main container max width and edge spacing - Padding top accounts for fixed combined header (76px top + 48px tabs + spacing) */
    .main .block-container,
    [data-testid="stMainBlockContainer"],
    div[data-testid="stMainBlockContainer"] {
        padding-top: 132px !important;
        padding-bottom: 2rem !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        margin-top: 0rem !important;
        max-width: 100% !important;
        width: 100% !important;
    }

    /* Zero out height for element-container holding portal-header so no extra gap is introduced */
    div[data-testid="stElementContainer"]:has(.portal-header),
    div[data-testid="element-container"]:has(.portal-header) {
        height: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    /* Portal Header Bar - Fixed Top Tier Header (Đảng & Chính quyền Red & Gold Theme) */
    .portal-header {
        background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #850f14 100%);
        border-bottom: 1px solid rgba(250, 204, 21, 0.3);
        border-radius: 0 !important;
        padding: 12px 1.5rem !important;
        margin: 0 !important;
        box-shadow: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: nowrap;
        gap: 16px;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 76px !important;
        box-sizing: border-box !important;
        z-index: 999999 !important;
    }

    .portal-header-left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0px;
    }

    .portal-breadcrumb {
        font-size: 12px;
        font-weight: 700;
        color: #fef08a;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1.2;
        margin-top: 6px;
        margin-bottom: 2px;
    }

    .portal-title {
        font-size: 18px !important;
        font-weight: 800 !important;
        color: #ffffff !important;
        margin: 0 !important;
        letter-spacing: 0.01em !important;
        line-height: 1.3 !important;
        text-transform: uppercase !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    .portal-badge {
        background-color: rgba(254, 240, 138, 0.12);
        border: 1px solid rgba(250, 204, 21, 0.4);
        color: #ffffff;
        border-radius: 8px;
        padding: 5px 14px;
        font-size: 11.5px;
        line-height: 1.3;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .portal-badge-title {
        font-size: 9.5px;
        font-weight: 700;
        color: #facc15;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 1px;
    }

    /* Step Banner Component */
    .step-banner {
        background-color: #ffffff;
        border: 1px solid #fee2e2;
        border-left: 4px solid #b91c1c;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 20px;
        margin-top: 14px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 8px rgba(185, 28, 28, 0.04);
    }

    .step-pill {
        background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        padding: 7px 14px;
        border-radius: 8px;
        letter-spacing: 0.06em;
        white-space: nowrap;
        border: 1px solid #facc15;
        box-shadow: 0 2px 6px rgba(185, 28, 28, 0.25);
    }

    .step-banner-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .step-banner-title {
        font-size: 16px !important;
        font-weight: 700 !important;
        color: #7f1d1d !important;
        margin: 0 !important;
    }

    .step-banner-subtitle {
        font-size: 12.5px;
        color: #64748b;
        margin: 0;
    }

    /* Tabs Customization - Fixed Bottom Tier Header Navigation Strip */
    div[data-testid="stTabs"] {
        margin-top: 0 !important;
        padding-top: 0 !important;
        margin-bottom: 20px;
    }

    div[data-testid="stTabs"] > div:first-child,
    div[data-testid="stTabs"] [role="tablist"],
    div[data-testid="stTabs"] [data-baseweb="tab-list"] {
        position: fixed !important;
        top: 76px !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 52px !important;
        z-index: 999998 !important;
        background: #ffffff !important;
        padding: 5px 1.5rem 0 1.5rem !important;
        margin: 0 !important;
        border-bottom: 2px solid #e2e8f0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
        display: flex !important;
        align-items: flex-end !important;
        box-sizing: border-box !important;
    }

    div[data-testid="stTabs"] button[role="tab"] {
        font-size: 13px !important;
        font-weight: 700 !important;
        padding: 10px 18px !important;
        color: #475569 !important;
        background-color: transparent !important;
        border: 1px solid transparent !important;
        border-bottom: none !important;
        border-radius: 8px 8px 0 0 !important;
        margin-right: 5px !important;
        transition: all 0.2s ease !important;
        white-space: nowrap !important;
    }

    div[data-testid="stTabs"] button[role="tab"] *,
    div[data-testid="stTabs"] button[role="tab"] p,
    div[data-testid="stTabs"] button[role="tab"] span,
    div[data-testid="stTabs"] button[role="tab"] div {
        color: inherit !important;
        font-weight: inherit !important;
        font-size: inherit !important;
    }

    div[data-testid="stTabs"] button[role="tab"]:hover {
        color: #b91c1c !important;
        background-color: #fef2f2 !important;
    }

    div[data-testid="stTabs"] button[role="tab"]:hover * {
        color: #b91c1c !important;
    }

    div[data-testid="stTabs"] button[role="tab"][aria-selected="true"] {
        color: #b91c1c !important;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-bottom: 3px solid #b91c1c !important;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05) !important;
        font-weight: 800 !important;
    }

    div[data-testid="stTabs"] button[role="tab"][aria-selected="true"] * {
        color: #b91c1c !important;
        font-weight: 800 !important;
    }

    div[data-testid="stTabs"] [data-baseweb="tab-highlight-container"] {
        display: none !important;
    }

    /* Panel Card Containers */
    .panel-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
    }

    .panel-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
    }

    .panel-num {
        width: 26px;
        height: 26px;
        background-color: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 12px;
    }

    .panel-title-text {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
    }

    /* Sidebar Customization */
    section[data-testid="stSidebar"] {
        background-color: #ffffff !important;
        border-right: 1px solid #e2e8f0 !important;
    }

    .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        margin-bottom: 16px;
        border-bottom: 1px solid #f1f5f9;
    }

    .sidebar-brand-logo {
        width: 38px;
        height: 38px;
        background-color: #2563eb;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 800;
        font-size: 18px;
    }

    .sidebar-brand-text {
        display: flex;
        flex-direction: column;
    }

    .sidebar-brand-tag {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .sidebar-brand-title {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
    }

    .sidebar-footer-box {
        background-color: #0f172a;
        border-radius: 12px;
        padding: 16px;
        color: #ffffff;
        margin-top: 24px;
    }

    .sidebar-footer-tag {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 6px;
    }

    .sidebar-footer-desc {
        font-size: 12px;
        color: #e2e8f0;
        line-height: 1.5;
        margin: 0;
    }

    /* Radio Navigation Options in Sidebar */
    div[data-testid="stRadio"] > label {
        font-size: 11px !important;
        font-weight: 700 !important;
        color: #94a3b8 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        margin-bottom: 8px !important;
    }

    div[data-testid="stRadio"] div[role="radiogroup"] {
        gap: 6px !important;
    }

    div[data-testid="stRadio"] div[role="radiogroup"] label {
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 10px !important;
        padding: 10px 14px !important;
        margin-bottom: 4px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
    }

    div[data-testid="stRadio"] div[role="radiogroup"] label:hover {
        background-color: #f8fafc !important;
        border-color: #cbd5e1 !important;
    }

    div[data-testid="stRadio"] div[role="radiogroup"] label[data-checked="true"],
    div[data-testid="stRadio"] div[role="radiogroup"] label:has(input:checked) {
        background-color: #eff6ff !important;
        border-color: #bfdbfe !important;
        color: #1d4ed8 !important;
        font-weight: 600 !important;
    }

    /* Stat Cards */
    .stat-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
    }

    .stat-label {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
    }

    .stat-value {
        font-size: 28px;
        font-weight: 300;
        font-style: italic;
        color: #0f172a;
        line-height: 1.1;
    }

    .stat-value-blue {
        color: #b91c1c;
    }

    .stat-value-orange {
        color: #d97706;
    }

    .stat-unit {
        font-size: 13px;
        font-weight: 400;
        font-style: normal;
        color: #94a3b8;
        margin-left: 4px;
    }

    /* Primary and Secondary Buttons - Party & State Theme */
    .stButton > button {
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        font-size: 13.5px !important;
        border-radius: 8px !important;
        padding: 9px 18px !important;
        border: none !important;
        box-shadow: 0 2px 6px rgba(185, 28, 28, 0.25) !important;
        transition: all 0.2s ease !important;
    }

    .stButton > button:hover {
        background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%) !important;
        box-shadow: 0 4px 12px rgba(185, 28, 28, 0.35) !important;
    }

    .stDownloadButton > button {
        background-color: #ffffff !important;
        color: #850f14 !important;
        font-weight: 600 !important;
        font-size: 13.5px !important;
        border-radius: 8px !important;
        padding: 9px 18px !important;
        border: 1px solid #fca5a5 !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
        transition: all 0.2s ease !important;
    }

    .stDownloadButton > button:hover {
        background-color: #fef2f2 !important;
        border-color: #b91c1c !important;
        color: #7f1d1d !important;
    }

    /* Headings */
    h1, h2, h3, h4 {
        color: #0f172a !important;
        font-weight: 700 !important;
        letter-spacing: -0.01em !important;
    }

    /* Input controls */
    div[data-baseweb="input"] {
        border-radius: 8px !important;
        border-color: #cbd5e1 !important;
    }

    div[data-baseweb="input"]:focus-within {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 1px #2563eb !important;
    }

    /* Dropzone file uploader */
    section[data-testid="stFileUploadDropzone"] {
        background-color: #f8fafc !important;
        border: 1px dashed #cbd5e1 !important;
        border-radius: 10px !important;
        padding: 12px 18px !important;
    }

    section[data-testid="stFileUploadDropzone"]:hover {
        border-color: #2563eb !important;
        background-color: #eff6ff !important;
    }

    section[data-testid="stFileUploadDropzone"] button {
        background-color: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        color: #1e293b !important;
        font-weight: 500 !important;
        font-size: 13px !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    }

    section[data-testid="stFileUploadDropzone"] button:hover {
        background-color: #f1f5f9 !important;
        border-color: #94a3b8 !important;
    }

    /* Dataframes */
    div[data-testid="stDataFrame"] {
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        background-color: #ffffff !important;
    }

    /* Alert banners */
    div.stAlert {
        border-radius: 12px !important;
    }

    /* Footer styling */
    .app-footer {
        margin-top: 40px;
        padding: 20px 0;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #94a3b8;
        font-size: 11px;
    }
</style>
""", unsafe_allow_html=True)

# Session State Initialization
if "df_data" not in st.session_state:
    st.session_state.df_data = None
if "processed_df" not in st.session_state:
    st.session_state.processed_df = None
if "zip_tab2" not in st.session_state:
    st.session_state.zip_tab2 = None
if "zip_tab3" not in st.session_state:
    st.session_state.zip_tab3 = None
if "doc_tab4" not in st.session_state:
    st.session_state.doc_tab4 = None
if "ngay_hop" not in st.session_state:
    st.session_state.ngay_hop = datetime.date.today()
if "xa_name" not in st.session_state or not st.session_state.xa_name:
    st.session_state.xa_name = "Hàm Yên"
if "huyen_name" not in st.session_state:
    st.session_state.huyen_name = ""
if "tinh_name" not in st.session_state or not st.session_state.tinh_name:
    st.session_state.tinh_name = "Tuyên Quang"
if "chu_tich" not in st.session_state or not st.session_state.chu_tich:
    st.session_state.chu_tich = "Nguyễn Hữu Hồng"
if "nguoi_lap" not in st.session_state or not st.session_state.nguoi_lap:
    st.session_state.nguoi_lap = "Phạm Thùy Dương"
if "y_te" not in st.session_state or not st.session_state.y_te:
    st.session_state.y_te = "Hoàng Văn Quỳnh"
if "mttq" not in st.session_state or not st.session_state.mttq:
    st.session_state.mttq = "Trịnh Trọng Duẩn"
if "so_thong_bao" not in st.session_state or not st.session_state.so_thong_bao:
    st.session_state.so_thong_bao = "40"
if "dia_diem" not in st.session_state or not st.session_state.dia_diem:
    st.session_state.dia_diem = "Tại bộ phận Tiếp nhận và trả kết quả UBND xã Hàm Yên"


def sanitize_filename(name):
    """Sanitizes filename for zip archive."""
    name = str(name).strip()
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    return name.replace(" ", "_") if name else "doi_tuong"


def parse_date_str(val):
    """Safely converts string or date object to datetime.date."""
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val if isinstance(val, datetime.date) else val.date()
    val_str = str(val).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None


def format_date_vn(dt):
    """Formats datetime.date to DD/MM/YYYY."""
    if not dt or not isinstance(dt, datetime.date):
        return ""
    return dt.strftime("%d/%m/%Y")


# Top Portal Header
xa_display = st.session_state.xa_name.upper() if st.session_state.xa_name else "..."
tinh_display = st.session_state.tinh_name.upper() if st.session_state.tinh_name else "..."

st.markdown(f"""
<div class="portal-header">
    <div class="portal-header-left">
        <div class="portal-breadcrumb">
            <span>🏛️ UBND XÃ {xa_display} &nbsp;•&nbsp; TỈNH {tinh_display}</span>
            <span>/</span>
            <span>HỆ THỐNG XỬ LÝ HỒ SƠ TỰ ĐỘNG HÓA</span>
        </div>
        <h1 class="portal-title">HỆ THỐNG QUẢN LÝ & XUẤT HỒ SƠ XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT</h1>
    </div>
    <div class="portal-badge">
        <div class="portal-badge-title">Cơ quan thực hiện</div>
        <div>Hội đồng XĐMĐKT Cấp Xã</div>
    </div>
</div>
""", unsafe_allow_html=True)



# ==========================================
# GIAO DIỆN CHÍNH DẠNG 5 TAB HÀNH CHÍNH
# ==========================================
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📋 TAB 1: Biểu Xác Định & Danh Sách",
    "📝 TAB 2: Phiếu Đánh Giá Khuyết Tật",
    "📄 TAB 3: Biên Bản Họp Hội Đồng",
    "📢 TAB 4: Thông Báo Niêm Yết Kết Quả",
    "⚙️ TAB 5: Cấu Hình Hành Chính"
])


# ==========================================
# TAB 1: BIỂU XÁC ĐỊNH & DANH SÁCH ĐỐI TƯỢNG
# ==========================================
with tab1:
    st.markdown("""
    <div class="step-banner">
        <div class="step-pill">TAB 1</div>
        <div class="step-banner-text">
            <h2 class="step-banner-title">BIỂU XÁC ĐỊNH DẠNG TẬT VÀ MỨC ĐỘ KHUYẾT TẬT DÀNH CHO THÀNH VIÊN HỘI ĐỒNG XÁC ĐỊNH MỨC ĐỘ CẤP XÃ</h2>
            <p class="step-banner-subtitle">Tải tệp Excel danh sách đối tượng, lưu dữ liệu, phân loại nhóm tuổi tự động và xem tổng số người.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown("""
        <div class="panel-header">
            <div class="panel-num">1</div>
            <div class="panel-title-text">Tải lên danh sách Excel đối tượng</div>
        </div>
        """, unsafe_allow_html=True)

        uploaded_file = st.file_uploader(
            "Chọn file Excel danh sách đối tượng (.xlsx, .xls):",
            type=["xlsx", "xls"]
        )

        if uploaded_file is not None:
            try:
                df_raw = pd.read_excel(uploaded_file)
                st.session_state.df_data = df_raw
                st.success(f"Tải lên thành công file '{uploaded_file.name}' với {len(df_raw)} bản ghi.")
            except Exception as e:
                st.error(f"Lỗi đọc file Excel: {str(e)}")

        st.markdown("<br/>", unsafe_allow_html=True)
        st.markdown("""
        <div class="panel-header">
            <div class="panel-num">2</div>
            <div class="panel-title-text">Hoặc sử dụng Danh sách Mẫu Thử Nghiệm</div>
        </div>
        """, unsafe_allow_html=True)

        c_samp1, c_samp2 = st.columns(2)
        with c_samp1:
            if st.button("🚀 Tải dữ liệu mẫu thử nghiệm ngay", use_container_width=True):
                df_sample, sample_bytes = generate_sample_excel()
                st.session_state.df_data = df_sample
                st.success("Đã tải dữ liệu mẫu thử nghiệm thành công!")

        with c_samp2:
            df_sample, sample_bytes = generate_sample_excel()
            render_download_button(
                data_bytes=sample_bytes,
                filename="File_Mau_Danh_Sach_Doi_Tuong.xlsx",
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                label="📄 Tải file Excel mẫu (.xlsx)",
                icon="📊",
                color="secondary"
            )

    with col2:
        st.markdown("""
        <div class="panel-header">
            <div class="panel-num">3</div>
            <div class="panel-title-text">Cấu hình Ngày họp & Thao tác File</div>
        </div>
        """, unsafe_allow_html=True)

        selected_ngay_hop = st.date_input(
            "Ngày họp đánh giá (mặc định hôm nay):",
            value=st.session_state.ngay_hop,
            format="DD/MM/YYYY"
        )
        st.session_state.ngay_hop = selected_ngay_hop

        st.markdown("<br/>", unsafe_allow_html=True)
        c_act1, c_act2 = st.columns(2)

        with c_act1:
            if st.session_state.df_data is not None:
                if st.button("💾 Lưu & Phân loại", use_container_width=True):
                    df = st.session_state.df_data.copy()
                    
                    # Identify columns
                    cols = df.columns.tolist()
                    col_dob = next((c for c in cols if "sinh" in str(c).lower() or "dob" in str(c).lower() or "NGAY_SINH" in str(c)), cols[1] if len(cols)>1 else cols[0])

                    tuoi_ngay_list = []
                    nhom_tuoi_list = []
                    ngay_sinh_clean = []

                    ngay_hop_dt = st.session_state.ngay_hop

                    for idx, row in df.iterrows():
                        dob_dt = parse_date_str(row[col_dob])
                        if dob_dt:
                            delta = (ngay_hop_dt - dob_dt).days
                            is_under_6 = delta <= (365.25 * 6)
                            tuoi_ngay_list.append(delta)
                            nhom_tuoi_list.append("Dưới 6 tuổi" if is_under_6 else "Từ 6 tuổi trở lên")
                            ngay_sinh_clean.append(format_date_vn(dob_dt))
                        else:
                            tuoi_ngay_list.append(None)
                            nhom_tuoi_list.append("Không xác định")
                            ngay_sinh_clean.append(str(row[col_dob]))

                    df["Tuổi (Số ngày)"] = tuoi_ngay_list
                    df["Nhóm tuổi"] = nhom_tuoi_list
                    df["Ngày sinh (Chuẩn)"] = ngay_sinh_clean

                    st.session_state.processed_df = df
                    st.session_state.zip_tab2 = None
                    st.session_state.zip_tab3 = None
                    st.session_state.doc_tab4 = None
                    st.success("Đã phân loại danh sách đối tượng thành công!")

        with c_act2:
            if st.session_state.df_data is not None or st.session_state.processed_df is not None:
                if st.button("🗑️ Xóa file dữ liệu", use_container_width=True):
                    st.session_state.df_data = None
                    st.session_state.processed_df = None
                    st.session_state.zip_tab2 = None
                    st.session_state.zip_tab3 = None
                    st.session_state.doc_tab4 = None
                    st.success("Đã xóa dữ liệu file thành công!")
                    st.rerun()

    # Hiển thị danh sách tổng số người ở Tab 1
    st.markdown("<br/>", unsafe_allow_html=True)
    st.markdown("""
    <div class="panel-header">
        <div class="panel-num">📊</div>
        <div class="panel-title-text">DANH SÁCH TỔNG SỐ NGƯỜI & KẾT QUẢ PHÂN LOẠI</div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.processed_df is not None:
        df_p = st.session_state.processed_df
        df_under = df_p[df_p["Nhóm tuổi"] == "Dưới 6 tuổi"]
        df_over = df_p[df_p["Nhóm tuổi"] == "Từ 6 tuổi trở lên"]

        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label">Tổng số người trong danh sách</div>
                <div class="stat-value">{len(df_p)} <span class="stat-unit">người</span></div>
            </div>
            """, unsafe_allow_html=True)
        with c2:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label" style="color: #2563eb;">Nhóm 1: Dưới 6 tuổi (Mẫu 02)</div>
                <div class="stat-value stat-value-blue">{len(df_under)} <span class="stat-unit">hồ sơ</span></div>
            </div>
            """, unsafe_allow_html=True)
        with c3:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label" style="color: #ea580c;">Nhóm 2: Từ 6 tuổi trở lên (Mẫu 01)</div>
                <div class="stat-value stat-value-orange">{len(df_over)} <span class="stat-unit">hồ sơ</span></div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br/>", unsafe_allow_html=True)
        filter_opt = st.radio(
            "Lọc hiển thị danh sách:",
            ["Tất cả đối tượng", "Nhóm 1: Dưới 6 tuổi", "Nhóm 2: Từ 6 tuổi trở lên"],
            horizontal=True
        )

        if filter_opt == "Nhóm 1: Dưới 6 tuổi":
            view_df = df_under
        elif filter_opt == "Nhóm 2: Từ 6 tuổi trở lên":
            view_df = df_over
        else:
            view_df = df_p

        st.dataframe(view_df, use_container_width=True)

        # Export filtered list to Excel
        output_excel = io.BytesIO()
        with pd.ExcelWriter(output_excel, engine='openpyxl') as writer:
            view_df.to_excel(writer, index=False, sheet_name='Danh_sach_doi_tuong')
        output_excel.seek(0)

        render_download_button(
            data_bytes=output_excel.getvalue(),
            filename=f"Danh_sach_{filter_opt.replace(' ', '_')}.xlsx",
            mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            label="📥 Tải danh sách Excel đã lọc (.xlsx)",
            icon="📊",
            color="primary"
        )
    else:
        st.info("Chưa có dữ liệu danh sách đối tượng. Vui lòng tải file Excel và nhấn **'Lưu & Phân loại'** ở trên.")



# ==========================================
# TAB 2: TẠO PHIẾU ĐÁNH GIÁ CÁ NHÂN
# ==========================================
with tab2:
    st.markdown("""
    <div class="step-banner">
        <div class="step-pill">TAB 2</div>
        <div class="step-banner-text">
            <h2 class="step-banner-title">PHIẾU XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT ĐỐI VỚI TRẺ EM DƯỚI 6 TUỔI & NGƯỜI TỪ ĐỦ 6 TUỔI TRỞ LÊN</h2>
            <p class="step-banner-subtitle">Tự động kết xuất Phiếu Mẫu 02 (trẻ em dưới 6 tuổi) hoặc Phiếu Mẫu 01 (người từ đủ 6 tuổi trở lên) chuẩn Thông tư 01/2019/TT-BLĐTBXH.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.processed_df is None:
        st.warning("⚠️ Vui lòng hoàn thành tải file và nhấn **'Lưu & Phân loại'** ở **Tab 1** trước!")
    else:
        df_p = st.session_state.processed_df
        st.info(f"Đã sẵn sàng tạo Phiếu xác định mức độ khuyết tật cho tổng số **{len(df_p)}** đối tượng.")

        st.markdown("""
        <div class="panel-card">
            <div class="panel-header">
                <div class="panel-num">📋</div>
                <div class="panel-title-text">Tùy chọn xuất Phiếu Đánh Giá Cá Nhân (File Word .docx)</div>
            </div>
            <p style="font-size: 13.5px; color: #475569; margin-bottom: 8px;">Bạn có thể tải <b>01 file Word cho 1 người</b>, hoặc <b>tải file ZIP chứa nhiều người được chọn</b>, hoặc <b>tải toàn bộ</b>.</p>
        </div>
        """, unsafe_allow_html=True)

        mode_tab2 = st.radio(
            "Chọn phương thức xuất tệp:",
            ["1️⃣ Tải về 01 File Word (.docx) cho 01 người cụ thể",
             "2️⃣ Tải về File ZIP (.zip) cho NHIỀU người được chọn",
             "3️⃣ Tải về File ZIP (.zip) cho TOÀN BỘ danh sách"],
            key="radio_mode_tab2"
        )

        ngay_hop_dt = st.session_state.ngay_hop
        xa = st.session_state.xa_name
        huyen = st.session_state.huyen_name
        tinh = st.session_state.tinh_name
        chu_tich = st.session_state.chu_tich
        nguoi_lap = st.session_state.nguoi_lap

        # Construct person options list
        options_list = []
        for idx, row in df_p.iterrows():
            ho_ten = str(row.get("Họ và tên", row.get("HO_TEN", f"Doi_tuong_{idx+1}")))
            dob_raw = row.get("Ngày sinh", row.get("NGAY_SINH", ""))
            dob_dt = parse_date_str(dob_raw)
            dob_str = format_date_vn(dob_dt) if dob_dt else str(dob_raw)
            thon = str(row.get("Thôn", ""))
            nhom = str(row.get("Nhóm tuổi", ""))
            options_list.append(f"{idx+1}. {ho_ten} | NS: {dob_str} | Thôn: {thon} ({nhom})")

        if "1️⃣" in mode_tab2:
            st.markdown("##### 📄 Tải file Word (.docx) cho 01 cá nhân")
            selected_option = st.selectbox("Chọn người cần xuất Phiếu Word:", options_list, key="sb_person_tab2")
            if selected_option:
                sel_idx = int(selected_option.split(".")[0]) - 1
                sel_row = df_p.iloc[sel_idx]
                ho_ten_sel = str(sel_row.get("Họ và tên", sel_row.get("HO_TEN", f"Doi_tuong_{sel_idx+1}")))

                if st.button(f"⚙️ Tạo Phiếu Word (.docx) cho {ho_ten_sel}", key="btn_gen_single_tab2", use_container_width=True):
                    fname, fbytes = generate_phieu_doc_for_row(sel_row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_lap)
                    st.session_state.single_doc_tab2 = {"bytes": fbytes, "name": fname, "person": ho_ten_sel}
                    st.success(f"Đã tạo thành công Phiếu đánh giá cho {ho_ten_sel}!")

                if st.session_state.get("single_doc_tab2"):
                    sdoc = st.session_state.single_doc_tab2
                    render_download_button(
                        data_bytes=sdoc["bytes"],
                        filename=sdoc["name"],
                        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        label=f"📄 Tải File Word (.docx) - {sdoc['person']}",
                        icon="📄",
                        color="success"
                    )

        elif "2️⃣" in mode_tab2:
            st.markdown("##### 📦 Tải file ZIP (.zip) cho NHIỀU người được chọn")
            selected_options = st.multiselect(
                "Chọn danh sách các cá nhân cần xuất (chọn 1 hoặc nhiều người):",
                options_list,
                default=options_list[:min(5, len(options_list))],
                key="ms_persons_tab2"
            )

            if selected_options:
                if st.button(f"⚙️ Tạo File ZIP (.zip) cho {len(selected_options)} người đã chọn", key="btn_gen_multi_tab2", use_container_width=True):
                    zip_buffer = io.BytesIO()
                    count = 0
                    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                        for opt in selected_options:
                            idx = int(opt.split(".")[0]) - 1
                            row = df_p.iloc[idx]
                            fname, fbytes = generate_phieu_doc_for_row(row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_lap)
                            zip_file.writestr(fname, fbytes)
                            count += 1

                    zip_buffer.seek(0)
                    st.session_state.multi_zip_tab2 = {
                        "bytes": zip_buffer.getvalue(),
                        "name": f"Phieu_Danh_Gia_{count}_Doi_Tuong.zip",
                        "count": count
                    }
                    st.success(f"Đã đóng gói thành công {count} Phiếu Word vào file ZIP!")

                if st.session_state.get("multi_zip_tab2"):
                    mzip = st.session_state.multi_zip_tab2
                    render_download_button(
                        data_bytes=mzip["bytes"],
                        filename=mzip["name"],
                        mime_type="application/zip",
                        label=f"📦 Tải File ZIP (.zip) - {mzip['count']} đối tượng đã chọn",
                        icon="📦",
                        color="primary"
                    )

        else: # Mode 3: All
            st.markdown("##### 📦 Tải file ZIP (.zip) chứa toàn bộ Phiếu Word trong danh sách")
            if st.button(f"⚙️ Tạo File ZIP (.zip) cho TOÀN BỘ {len(df_p)} đối tượng", key="btn_gen_all_tab2", use_container_width=True):
                zip_buffer = io.BytesIO()
                count = 0
                with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                    for idx, row in df_p.iterrows():
                        fname, fbytes = generate_phieu_doc_for_row(row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_lap)
                        zip_file.writestr(fname, fbytes)
                        count += 1

                zip_buffer.seek(0)
                st.session_state.all_zip_tab2 = {
                    "bytes": zip_buffer.getvalue(),
                    "name": "Toan_Bo_Phieu_Danh_Gia_Khuyet_Tat.zip",
                    "count": count
                }
                st.success(f"Đã đóng gói thành công toàn bộ {count} Phiếu Word vào file ZIP!")

            if st.session_state.get("all_zip_tab2"):
                azip = st.session_state.all_zip_tab2
                render_download_button(
                    data_bytes=azip["bytes"],
                    filename=azip["name"],
                    mime_type="application/zip",
                    label=f"📦 Tải File ZIP (.zip) - TOÀN BỘ {azip['count']} đối tượng",
                    icon="📦",
                    color="primary"
                )


# ==========================================
# TAB 3: TẠO BIÊN BẢN HỌP HỘI ĐỒNG
# ==========================================
with tab3:
    st.markdown("""
    <div class="step-banner">
        <div class="step-pill">TAB 3</div>
        <div class="step-banner-text">
            <h2 class="step-banner-title">BIÊN BẢN HỌP KẾT LUẬN DẠNG KHUYẾT TẬT VÀ MỨC ĐỘ KHUYẾT TẬT</h2>
            <p class="step-banner-subtitle">Tạo Biên bản họp Hội đồng cho từng cá nhân hoặc hàng loạt đối tượng theo danh sách.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.processed_df is None:
        st.warning("⚠️ Vui lòng hoàn thành tải file và nhấn **'Lưu & Phân loại'** ở **Tab 1** trước!")
    else:
        df_p = st.session_state.processed_df
        st.info(f"Đã sẵn sàng tạo Biên bản họp Hội đồng cho **{len(df_p)}** đối tượng.")

        col_gio, col_phut, col_diadiem = st.columns([1, 1, 3])
        with col_gio:
            gio_hop = st.text_input("Giờ họp (VD: 08)", value="08", key="gio_hop_tb3")
        with col_phut:
            phut_hop = st.text_input("Phút họp (VD: 30)", value="30", key="phut_hop_tb3")
        with col_diadiem:
            dia_diem_hop = st.text_input(
                "Địa điểm họp",
                value=f"Tại hội trường UBND xã {st.session_state.xa_name}" if st.session_state.xa_name else "Tại hội trường UBND xã",
                key="dia_diem_tb3"
            )

        st.markdown("""
        <div class="panel-card">
            <div class="panel-header">
                <div class="panel-num">📝</div>
                <div class="panel-title-text">Tùy chọn xuất Biên Bản Họp Hội Đồng (File Word .docx)</div>
            </div>
            <p style="font-size: 13.5px; color: #475569; margin-bottom: 8px;">Bạn có thể tải <b>01 Biên bản Word cho 1 người</b>, hoặc <b>tải file ZIP chứa nhiều người được chọn</b>, hoặc <b>tải toàn bộ</b>.</p>
        </div>
        """, unsafe_allow_html=True)

        mode_tab3 = st.radio(
            "Chọn phương thức xuất tệp:",
            ["1️⃣ Tải về 01 Biên Bản Họp Word (.docx) cho 01 người cụ thể",
             "2️⃣ Tải về File ZIP (.zip) cho NHIỀU người được chọn",
             "3️⃣ Tải về File ZIP (.zip) cho TOÀN BỘ danh sách"],
            key="radio_mode_tab3"
        )

        ngay_hop_dt = st.session_state.ngay_hop
        xa = st.session_state.xa_name
        huyen = st.session_state.huyen_name
        tinh = st.session_state.tinh_name
        chu_tich = st.session_state.chu_tich
        nguoi_ghi = st.session_state.nguoi_lap
        y_te = st.session_state.y_te
        mttq = st.session_state.mttq

        options_list = []
        for idx, row in df_p.iterrows():
            ho_ten = str(row.get("Họ và tên", row.get("HO_TEN", f"Doi_tuong_{idx+1}")))
            dob_raw = row.get("Ngày sinh", row.get("NGAY_SINH", ""))
            dob_dt = parse_date_str(dob_raw)
            dob_str = format_date_vn(dob_dt) if dob_dt else str(dob_raw)
            thon = str(row.get("Thôn", ""))
            options_list.append(f"{idx+1}. {ho_ten} | NS: {dob_str} | Thôn: {thon}")

        if "1️⃣" in mode_tab3:
            st.markdown("##### 📄 Tải 01 Biên Bản Họp Word (.docx) cho 01 cá nhân")
            selected_option = st.selectbox("Chọn người cần xuất Biên bản họp:", options_list, key="sb_person_tab3")
            if selected_option:
                sel_idx = int(selected_option.split(".")[0]) - 1
                sel_row = df_p.iloc[sel_idx]
                ho_ten_sel = str(sel_row.get("Họ và tên", sel_row.get("HO_TEN", f"Doi_tuong_{sel_idx+1}")))

                if st.button(f"⚙️ Tạo Biên Bản Họp Word (.docx) cho {ho_ten_sel}", key="btn_gen_single_tab3", use_container_width=True):
                    fname, fbytes = generate_bien_ban_doc_for_row(sel_row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_ghi, y_te, mttq, gio_hop, phut_hop, dia_diem_hop)
                    st.session_state.single_doc_tab3 = {"bytes": fbytes, "name": fname, "person": ho_ten_sel}
                    st.success(f"Đã tạo thành công Biên bản họp cho {ho_ten_sel}!")

                if st.session_state.get("single_doc_tab3"):
                    sdoc = st.session_state.single_doc_tab3
                    render_download_button(
                        data_bytes=sdoc["bytes"],
                        filename=sdoc["name"],
                        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        label=f"📄 Tải File Word (.docx) - {sdoc['person']}",
                        icon="📄",
                        color="success"
                    )

        elif "2️⃣" in mode_tab3:
            st.markdown("##### 📦 Tải file ZIP (.zip) cho NHIỀU người được chọn")
            selected_options = st.multiselect(
                "Chọn danh sách các cá nhân cần xuất Biên bản họp:",
                options_list,
                default=options_list[:min(5, len(options_list))],
                key="ms_persons_tab3"
            )

            if selected_options:
                if st.button(f"⚙️ Tạo File ZIP (.zip) cho {len(selected_options)} người đã chọn", key="btn_gen_multi_tab3", use_container_width=True):
                    zip_buffer = io.BytesIO()
                    count = 0
                    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                        for opt in selected_options:
                            idx = int(opt.split(".")[0]) - 1
                            row = df_p.iloc[idx]
                            fname, fbytes = generate_bien_ban_doc_for_row(row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_ghi, y_te, mttq, gio_hop, phut_hop, dia_diem_hop)
                            zip_file.writestr(fname, fbytes)
                            count += 1

                    zip_buffer.seek(0)
                    st.session_state.multi_zip_tab3 = {
                        "bytes": zip_buffer.getvalue(),
                        "name": f"Bien_Ban_Hop_{count}_Doi_Tuong.zip",
                        "count": count
                    }
                    st.success(f"Đã đóng gói thành công {count} Biên bản họp vào file ZIP!")

                if st.session_state.get("multi_zip_tab3"):
                    mzip = st.session_state.multi_zip_tab3
                    render_download_button(
                        data_bytes=mzip["bytes"],
                        filename=mzip["name"],
                        mime_type="application/zip",
                        label=f"📦 Tải File ZIP (.zip) - {mzip['count']} đối tượng đã chọn",
                        icon="📦",
                        color="primary"
                    )

        else: # Mode 3: All
            st.markdown("##### 📦 Tải file ZIP (.zip) chứa toàn bộ Biên Bản Họp trong danh sách")
            if st.button(f"⚙️ Tạo File ZIP (.zip) cho TOÀN BỘ {len(df_p)} đối tượng", key="btn_gen_all_tab3", use_container_width=True):
                zip_buffer = io.BytesIO()
                count = 0
                with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                    for idx, row in df_p.iterrows():
                        fname, fbytes = generate_bien_ban_doc_for_row(row, ngay_hop_dt, xa, huyen, tinh, chu_tich, nguoi_ghi, y_te, mttq, gio_hop, phut_hop, dia_diem_hop)
                        zip_file.writestr(fname, fbytes)
                        count += 1

                zip_buffer.seek(0)
                st.session_state.all_zip_tab3 = {
                    "bytes": zip_buffer.getvalue(),
                    "name": "Toan_Bo_Bien_Ban_Hop_Hoi_Dong.zip",
                    "count": count
                }
                st.success(f"Đã đóng gói thành công toàn bộ {count} Biên bản họp vào file ZIP!")

            if st.session_state.get("all_zip_tab3"):
                azip = st.session_state.all_zip_tab3
                render_download_button(
                    data_bytes=azip["bytes"],
                    filename=azip["name"],
                    mime_type="application/zip",
                    label=f"📦 Tải File ZIP (.zip) - TOÀN BỘ {azip['count']} đối tượng",
                    icon="📦",
                    color="primary"
                )


# ==========================================
# TAB 4: TẠO THÔNG BÁO NIÊM YẾT KẾT QUẢ
# ==========================================
with tab4:
    st.markdown("""
    <div class="step-banner">
        <div class="step-pill">TAB 4</div>
        <div class="step-banner-text">
            <h2 class="step-banner-title">THÔNG BÁO Về việc niêm yết công khai kết quả họp kết luận dạng tật và mức độ khuyết tật</h2>
            <p class="step-banner-subtitle">Tự động chèn DANH SÁCH THÔNG BÁO NIÊM YẾT KẾT QUẢ XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT vào văn bản chính thức chuẩn thể thức văn bản hành chính.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.processed_df is None:
        st.warning("⚠️ Vui lòng hoàn thành tải file và nhấn **'Lưu & Phân loại'** ở **Tab 1** trước!")
    else:
        df_p = st.session_state.processed_df
        st.info(f"Đã sẵn sàng tạo **01 Thông Báo Niêm Yết** tổng hợp danh sách **{len(df_p)}** đối tượng.")

        st.markdown("""
        <div class="panel-card">
            <div class="panel-header">
                <div class="panel-num">📢</div>
                <div class="panel-title-text">Thông tin niêm yết công khai & Danh sách đính kèm</div>
            </div>
            <p style="font-size: 13.5px; color: #475569; margin: 0;">Văn bản xuất ra bao gồm nội dung Thông báo chính thức và bảng <b>DANH SÁCH THÔNG BÁO NIÊM YẾT KẾT QUẢ XÁC ĐỊNH MỨC ĐỘ KHUYẾT TẬT</b> của toàn bộ đối tượng.</p>
        </div>
        """, unsafe_allow_html=True)

        c1, c2 = st.columns(2)
        with c1:
            so_tb = st.text_input("Số Thông báo", value=st.session_state.so_thong_bao, placeholder="VD: 01/TB-UBND")
            st.session_state.so_thong_bao = so_tb
            
            dia_diem_ny = st.text_input("Địa điểm niêm yết", value=st.session_state.dia_diem, placeholder="Nhập địa điểm niêm yết...")
            st.session_state.dia_diem = dia_diem_ny
        with c2:
            thoi_gian_ny = st.text_input("Thời gian niêm yết", value="05 ngày làm việc")
            ngay_hop_dt = st.session_state.ngay_hop
            st.write(f"**Ngày ký thông báo:** {format_date_vn(ngay_hop_dt)}")

        if st.button("⚙️ Tạo Thông Báo Niêm Yết (.docx)", use_container_width=True):
            xa = st.session_state.xa_name
            huyen = st.session_state.huyen_name
            tinh = st.session_state.tinh_name
            chu_tich = st.session_state.chu_tich

            so_tb_clean = so_tb.strip()
            if not so_tb_clean:
                so_tb_formatted = "      /TB-UBND"
            elif "/TB" not in so_tb_clean.upper():
                so_tb_formatted = f"{so_tb_clean}/TB-UBND"
            else:
                so_tb_formatted = so_tb_clean

            data_dict = {
                "SO_THONG_BAO": so_tb_formatted,
                "XA": xa,
                "XA_UPPER": xa.upper(),
                "HUYEN": huyen,
                "TINH": tinh,
                "SO_LUONG_TRUONG_HOP": str(len(df_p)),
                "DIA_DIEM_NIEM_YET": dia_diem_ny,
                "THOI_GIAN_NIEM_YET": thoi_gian_ny,
                "NGAY_HOP_NGAY": str(ngay_hop_dt.day).zfill(2),
                "NGAY_HOP_THANG": str(ngay_hop_dt.month).zfill(2),
                "NGAY_HOP_NAM": str(ngay_hop_dt.year),
                "CHU_TICH": chu_tich
            }

            # Prepare df_list for table
            df_list = []
            for idx, row in df_p.iterrows():
                ho_ten = str(row.get("Họ và tên", row.get("HO_TEN", "")))
                dob_raw = row.get("Ngày sinh", row.get("NGAY_SINH", ""))
                dob_dt = parse_date_str(dob_raw)
                dob_str = format_date_vn(dob_dt) if dob_dt else str(dob_raw)

                df_list.append({
                    "HO_TEN": ho_ten,
                    "NGAY_SINH": dob_str,
                    "THON": str(row.get("Thôn", "")),
                    "DANG_TAT": str(row.get("Dạng tật", "")),
                    "MUC_DO": str(row.get("Mức độ khuyết tật", "")),
                    "GHI_CHU": str(row.get("Ghi chú", ""))
                })

            doc = create_thong_bao_niem_yet_doc(data_dict=data_dict, df_list=df_list)

            doc_io = io.BytesIO()
            doc.save(doc_io)
            doc_io.seek(0)

            st.session_state.doc_tab4 = {
                "bytes": doc_io.getvalue(),
                "name": f"Thong_Bao_Niem_Yet_Ket_Qua_Xa_{sanitize_filename(xa)}.docx"
            }
            st.success("Đã tạo thành công Thông báo niêm yết kết quả chuẩn thể thức văn bản hành chính!")

        if st.session_state.doc_tab4 is not None:
            dt4 = st.session_state.doc_tab4
            render_download_button(
                data_bytes=dt4["bytes"],
                filename=dt4["name"],
                mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                label="📄 Tải về Thông Báo Niêm Yết (.docx)",
                icon="📄",
                color="success"
            )


# ==========================================
# TAB 5: CẤU HÌNH HÀNH CHÍNH
# ==========================================
with tab5:
    st.markdown("""
    <div class="step-banner">
        <div class="step-pill">TAB 5</div>
        <div class="step-banner-text">
            <h2 class="step-banner-title">CẤU HÌNH HÀNH CHÍNH & THÔNG TIN HỘI ĐỒNG XÁC ĐỊNH MỨC ĐỘ CẤP XÃ</h2>
            <p class="step-banner-subtitle">Quản lý các thông số đơn vị, lãnh đạo người ký và thông tin niêm yết tự động điền vào hồ sơ văn bản.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="panel-card">
        <div class="panel-header">
            <div class="panel-num">⚙️</div>
            <div class="panel-title-text">Cấu hình thông tin văn bản hành chính dùng chung</div>
        </div>
        <p style="font-size: 13.5px; color: #475569; margin-bottom: 20px;">Tất cả thông tin nhập dưới đây sẽ tự động được thay thế vào các mẫu văn bản: <b>Phiếu đánh giá cá nhân (Mẫu 01, Mẫu 02)</b>, <b>Biên bản họp Hội đồng</b> và <b>Thông báo niêm yết kết quả</b>.</p>
    """, unsafe_allow_html=True)

    c_cfg1, c_cfg2 = st.columns(2)

    with c_cfg1:
        st.markdown("#### 🏛️ Đơn vị & Địa điểm Hành chính")
        val_xa = st.text_input("Tên Xã / Thị trấn", value=st.session_state.xa_name, placeholder="VD: Hàm Yên")
        st.session_state.xa_name = val_xa

        val_tinh = st.text_input("Tên Tỉnh / Thành phố", value=st.session_state.tinh_name, placeholder="VD: Tuyên Quang")
        st.session_state.tinh_name = val_tinh

        val_so = st.text_input("Số Thông báo (Xuất Thông báo niêm yết)", value=st.session_state.so_thong_bao, placeholder="VD: 40")
        st.session_state.so_thong_bao = val_so

        val_dd = st.text_input("Địa điểm niêm yết công khai kết quả", value=st.session_state.dia_diem, placeholder="VD: Tại bộ phận Tiếp nhận và trả kết quả UBND xã Hàm Yên")
        st.session_state.dia_diem = val_dd

    with c_cfg2:
        st.markdown("#### 👥 Nhân sự & Thành viên Hội đồng")
        val_ct = st.text_input("Họ tên Người ký / Chủ tịch Hội đồng", value=st.session_state.chu_tich, placeholder="VD: Nguyễn Hữu Hồng")
        st.session_state.chu_tich = val_ct

        val_nl = st.text_input("Người lập / Ghi biên bản họp", value=st.session_state.nguoi_lap, placeholder="VD: Phạm Thùy Dương")
        st.session_state.nguoi_lap = val_nl

        val_yt = st.text_input("Trưởng Trạm Y tế", value=st.session_state.y_te, placeholder="VD: Hoàng Văn Quỳnh")
        st.session_state.y_te = val_yt

        val_mt = st.text_input("Đại diện UB MTTQ", value=st.session_state.mttq, placeholder="VD: Trịnh Trọng Duẩn")
        st.session_state.mttq = val_mt

    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("<br/>", unsafe_allow_html=True)
    c_btn1, c_btn2 = st.columns(2)
    with c_btn1:
        if st.button("💾 Lưu Cấu Hình Hành Chính", use_container_width=True):
            st.success("✅ Đã cập nhật và lưu thông tin cấu hình hành chính thành công!")
    with c_btn2:
        if st.button("🔄 Khôi phục Thông tin Mặc định Mẫu", use_container_width=True):
            st.session_state.xa_name = "Hàm Yên"
            st.session_state.tinh_name = "Tuyên Quang"
            st.session_state.chu_tich = "Nguyễn Hữu Hồng"
            st.session_state.nguoi_lap = "Phạm Thùy Dương"
            st.session_state.y_te = "Hoàng Văn Quỳnh"
            st.session_state.mttq = "Trịnh Trọng Duẩn"
            st.session_state.so_thong_bao = "40"
            st.session_state.dia_diem = "Tại bộ phận Tiếp nhận và trả kết quả UBND xã Hàm Yên"
            st.success("✅ Đã khôi phục các thông tin hành chính mặc định mẫu thành công!")
            st.rerun()



