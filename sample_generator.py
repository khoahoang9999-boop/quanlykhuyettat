import pandas as pd
import io
import datetime

def generate_sample_excel():
    """Generates a sample pandas DataFrame and Excel bytes with realistic administrative data."""
    today = datetime.date.today()

    data = [
        {
            "STT": 1,
            "Họ và tên": "Phạm Trường Giang",
            "Ngày sinh": "2021-02-03", # Under 6 years old
            "Giới tính": "Nam",
            "Thôn": "Ba Trãng",
            "Số CMND/CCCD": "",
            "Dạng tật": "Vận động",
            "Mức độ khuyết tật": "Đặc biệt nặng",
            "Ghi chú": "Bại não từ nhỏ, không tự vận động",
            "Người đại diện": "Phạm Văn Hùng",
            "Mối quan hệ": "Bố đẻ",
            "SĐT người đại diện": "0912345678"
        },
        {
            "STT": 2,
            "Họ và tên": "Vũ Khánh An",
            "Ngày sinh": "2022-10-22", # Under 6 years old
            "Giới tính": "Nữ",
            "Thôn": "Tân Thành",
            "Số CMND/CCCD": "",
            "Dạng tật": "Trí tuệ",
            "Mức độ khuyết tật": "Nặng",
            "Ghi chú": "Chậm phát triển trí tuệ nặng",
            "Người đại diện": "Trần Thị Huệ",
            "Mối quan hệ": "Mẹ đẻ",
            "SĐT người đại diện": "0987654321"
        },
        {
            "STT": 3,
            "Họ và tên": "Phàn Văn Phú",
            "Ngày sinh": "1971-12-27", # Over 6 years old
            "Giới tính": "Nam",
            "Thôn": "Thuốc Hạ",
            "Số CMND/CCCD": "001071001234",
            "Dạng tật": "Vận động",
            "Mức độ khuyết tật": "Nặng",
            "Ghi chú": "Liệt 1/2 người sau tai biến",
            "Người đại diện": "Phàn Thị Mai",
            "Mối quan hệ": "Con gái",
            "SĐT người đại diện": "0971122334"
        },
        {
            "STT": 4,
            "Họ và tên": "Đặng Trần Quý",
            "Ngày sinh": "1960-07-01", # Over 6 years old
            "Giới tính": "Nam",
            "Thôn": "Tân Tiến",
            "Số CMND/CCCD": "001060002345",
            "Dạng tật": "Nghe, nói",
            "Mức độ khuyết tật": "Nặng",
            "Ghi chú": "Câm điếc bẩm sinh",
            "Người đại diện": "",
            "Mối quan hệ": "",
            "SĐT người đại diện": ""
        },
        {
            "STT": 5,
            "Họ và tên": "Trần Thị Nhung",
            "Ngày sinh": "1942-04-14", # Over 6 years old
            "Giới tính": "Nữ",
            "Thôn": "Đồng Tàn",
            "Số CMND/CCCD": "001042003456",
            "Dạng tật": "Nhìn",
            "Mức độ khuyết tật": "Đặc biệt nặng",
            "Ghi chú": "Mù 2 mắt hoàn toàn",
            "Người đại diện": "Nguyễn Văn Đức",
            "Mối quan hệ": "Con trai",
            "SĐT người đại diện": "0965432109"
        },
        {
            "STT": 6,
            "Họ và tên": "Vũ Hữu Công",
            "Ngày sinh": "1954-03-06", # Over 6 years old
            "Giới tính": "Nam",
            "Thôn": "Tân Yên",
            "Số CMND/CCCD": "001054004567",
            "Dạng tật": "Thần kinh, tâm thần",
            "Mức độ khuyết tật": "Đặc biệt nặng",
            "Ghi chú": "Tâm thần phân liệt thể nặng",
            "Người đại diện": "Vũ Thị Hương",
            "Mối quan hệ": "Em gái",
            "SĐT người đại diện": "0943210987"
        },
        {
            "STT": 7,
            "Họ và tên": "Nguyễn Trần Kiều Tiên",
            "Ngày sinh": "2023-05-09", # Under 6 years old
            "Giới tính": "Nữ",
            "Thôn": "Việt Thành",
            "Số CMND/CCCD": "",
            "Dạng tật": "Vận động",
            "Mức độ khuyết tật": "Nặng",
            "Ghi chú": "Thiếu hai chân bẩm sinh",
            "Người đại diện": "Nguyễn Văn Kiên",
            "Mối quan hệ": "Bố đẻ",
            "SĐT người đại diện": "0932109876"
        }
    ]

    df = pd.DataFrame(data)
    
    # Save to Excel bytes buffer
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Danh_sach_doi_tuong')
    output.seek(0)
    return df, output.getvalue()
