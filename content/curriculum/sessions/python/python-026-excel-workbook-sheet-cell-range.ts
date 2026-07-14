import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-026"],
  slug: "python-026-excel-workbook-sheet-cell-range",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 26,
  title: "Excel 워크북·시트·셀·범위",
  subtitle: "openpyxl로 xlsx를 만들고 다시 읽으면서 Workbook→Worksheet→Cell 계층, 범위 순회, 수식 캐시, 스타일·날짜, 대용량 모드와 안전한 저장 경계를 익힙니다.",
  level: "중급",
  estimatedMinutes: 145,
  coreQuestion: "Python 객체와 Excel의 Workbook·Worksheet·Cell·범위를 어떻게 정확히 연결하고, 수식·스타일·대용량·불신 입력·저장 실패까지 안전하게 다룰까요?",
  summary: "openpyxl은 Excel 프로그램을 원격 조작하는 도구가 아니라 OOXML 기반 xlsx 파일을 읽고 쓰는 Python 라이브러리입니다. Workbook 안에 순서 있는 Worksheet가 있고 각 Worksheet가 1부터 시작하는 행·열 좌표의 Cell을 가집니다. 새 파일에서 시트를 만들고 제목을 바꾸며 주소·row/column·append로 값을 쓴 뒤, 범위를 행 단위로 순회하고 빈 셀 None을 구분합니다. Python date와 number_format, 공유 스타일, 수식 문자열과 data_only의 마지막 계산 캐시를 실제 파일로 검증합니다. 큰 파일의 read_only/write_only 제한, 명시적 close, 같은 디렉터리 임시 파일을 이용한 원자적 교체, formula injection을 막는 불신 텍스트 정책까지 운영 관점으로 확장합니다.",
  objectives: [
    "Workbook·Worksheet·Cell의 포함 관계와 xlsx 파일·Excel 애플리케이션의 차이를 설명할 수 있다.",
    "새 Workbook의 기본 시트를 이름 변경하고 시트를 원하는 위치에 추가해 sheetnames 순서를 예측할 수 있다.",
    "A1 주소, 1-based row/column, append를 사용하고 Python 값이 Cell.value와 data_type으로 어떻게 저장되는지 확인할 수 있다.",
    "셀 범위를 행→셀 순서로 순회하고 빈 셀 None을 보존하거나 제외하는 정책을 구현할 수 있다.",
    "날짜 객체·number_format·Font 등의 값과 표시 형식을 구분하고 저장 후 재조회할 수 있다.",
    "data_only=False의 수식과 data_only=True의 마지막 계산 캐시를 구분하며 openpyxl이 수식을 계산하지 않는다는 한계를 설명할 수 있다.",
    "read_only·write_only의 메모리 장점과 Cell 접근·append·save·close 제한을 목적에 맞게 선택할 수 있다.",
    "불신 문자열의 formula injection 정책과 같은 볼륨 임시 파일→os.replace 원자 저장 패턴을 적용할 수 있다.",
  ],
  prerequisites: [
    {
      title: "경로·텍스트·CSV 입출력",
      reason: "xlsx도 경로에 저장되는 파일이며 상대경로·현재 작업 폴더·파일 close·덮어쓰기 실패를 같은 자원 수명 관점으로 이해해야 합니다.",
    },
    {
      title: "list·dict와 중첩 반복",
      reason: "행을 list로 append하고 범위를 row tuple→Cell 순으로 이중 반복하며 결과를 구조화할 때 필요합니다.",
      sessionSlug: "python-020-comprehensions-declarative-transform",
    },
    {
      title: "예외와 파일 실패의 기본 구분",
      reason: "없는 파일, 잘못된 시트, 잠긴 대상, 깨진 xlsx, 잘못된 값 형식을 사용자 입력 문제와 시스템 문제로 나눌 수 있어야 합니다.",
    },
  ],
  keywords: ["Python", "openpyxl", "xlsx", "Workbook", "Worksheet", "Cell", "range", "data_only", "formula cache", "read_only", "write_only", "Font", "number_format", "date", "formula injection", "atomic save"],
  chapters: [
    {
      id: "xlsx-object-model",
      title: "openpyxl은 Excel 화면이 아니라 xlsx 문서 구조를 다룹니다",
      lead: "Excel 창을 띄우거나 수식 엔진을 실행하는 것이 아니라 ZIP 기반 OOXML 문서의 workbook·worksheet·cell 데이터를 Python 객체로 읽고 씁니다.",
      explanations: [
        "Workbook은 최상위 문서 컨테이너입니다. 디스크의 .xlsx 파일 하나에 대응하며 여러 Worksheet, 문서 속성, 스타일, 이름 정의와 관계 정보를 가질 수 있습니다. Worksheet는 사용자가 보는 시트 탭 하나이고, Cell은 한 worksheet의 행·열 좌표 한 칸입니다. 같은 A1 주소라도 서로 다른 worksheet에서는 별도 Cell입니다.",
        "openpyxl은 데스크톱 Excel 프로세스를 자동 조작하지 않습니다. Workbook.save가 OOXML 파일을 만들지만 Excel의 계산 엔진을 호출해 수식을 새로 계산하거나 차트 화면을 렌더링하지 않습니다. 이 경계를 이해해야 data_only=True가 예상한 계산값 대신 None 또는 오래된 값을 주는 이유를 설명할 수 있습니다.",
        "원본 ex06_excel.py를 Python 3.13.9와 openpyxl 3.1.5로 임시 폴더에서 실행하면 실제 xlsx가 생성됩니다. 재조회 결과 시트 순서는 ['타이틀 연습', '세번째 시트', '성적 관련 보고서']입니다. 첫 시트에는 A1·B2·E3·A4, 두 번째 시트에는 A1:I1 숫자 1~9, 세 번째 시트에는 A1·B2·C3·D4·E5 대각선 문자열이 저장됐습니다.",
        "xlsx는 xls와 다른 형식입니다. openpyxl의 주 대상은 xlsx·xlsm 계열이며 과거 바이너리 .xls 파일을 이름만 .xlsx로 바꾼다고 변환되지 않습니다. 매크로 포함 xlsm을 열고 저장하는 경우 keep_vba와 확장자 정책을 별도로 검토해야 하며, openpyxl이 모든 Excel 기능을 완전 보존한다고 가정하지 않습니다.",
      ],
      concepts: [
        {
          term: "Workbook",
          definition: "worksheet와 문서 수준 정보를 포함하는 openpyxl 최상위 객체이자 저장할 xlsx 문서 단위입니다.",
          detail: ["Workbook()은 일반 모드에서 기본 worksheet 하나를 만듭니다.", "load_workbook(path)는 기존 xlsx를 읽어 Workbook 객체를 반환합니다."],
          analogy: "Workbook이 한 권의 바인더라면 Worksheet는 탭으로 나눈 장, Cell은 각 장의 좌표가 있는 칸입니다.",
        },
        {
          term: "OOXML/xlsx",
          definition: "XML 문서와 관계·리소스를 ZIP 패키지로 묶은 Excel 통합문서 형식입니다.",
          detail: ["확장자가 맞더라도 내부 ZIP·XML이 깨지면 load_workbook이 실패합니다.", "Excel 애플리케이션 기능 전체와 openpyxl이 읽고 쓰는 OOXML 부분 집합은 같지 않습니다."],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "openpyxl.load_workbook에서 BadZipFile 또는 지원하지 않는 파일 형식 오류가 발생한다.",
          likelyCause: "파일이 실제 xlsx ZIP 패키지가 아니거나 다운로드·복사 중 깨졌거나 과거 .xls 파일의 확장자만 바꿨습니다.",
          checks: ["파일 확장자뿐 아니라 생성 프로그램과 원본 형식을 확인합니다.", "파일 크기가 0인지와 ZIP 도구로 열리는지 확인합니다.", "정상 Excel에서 열어 새 xlsx로 저장한 복사본으로 재현합니다."],
          fix: "원본 형식을 지원하는 라이브러리로 읽거나 Excel·LibreOffice에서 정상 xlsx로 변환합니다. 깨진 파일은 신뢰 가능한 원본에서 다시 받습니다.",
          prevention: "업로드 시 확장자·MIME·파일 크기·ZIP 구조를 검증하고 원본을 덮어쓰기 전에 별도 복사본에서 읽기 검사를 합니다.",
        },
      ],
      expertNotes: [
        "불신 xlsx는 압축·XML 자원 공격 표면이 될 수 있습니다. 최신 openpyxl과 defusedxml 사용, 파일 크기·압축 해제 상한, 격리 처리를 검토합니다.",
        "기존 복잡한 workbook을 열어 같은 이름에 저장하면 지원하지 않는 shapes 등 일부 기능이 손실될 수 있으므로 round-trip 회귀 파일을 보존합니다.",
      ],
    },
    {
      id: "workbook-worksheet-lifecycle",
      title: "새 Workbook의 기본 시트와 시트 순서를 의도적으로 관리합니다",
      lead: "일반 Workbook에는 기본 시트 하나가 있으며 create_sheet의 위치, title 변경 순서가 최종 sheetnames를 결정합니다.",
      explanations: [
        "wb = Workbook()을 만들면 일반 모드에서는 wb.active로 얻을 수 있는 기본 Worksheet가 하나 존재합니다. 기본 제목은 보통 Sheet이지만 코드가 즉시 ws.title = '요약'처럼 업무 의미를 부여하면 이후 index가 아니라 이름으로 안정적으로 선택할 수 있습니다. active는 현재 활성 탭 설정과 관련된 위치일 뿐 항상 첫 번째 업무 시트라는 영구 계약으로 쓰지 않습니다.",
        "wb.create_sheet('상세')는 기본적으로 끝에 시트를 추가하고 wb.create_sheet('설정', 1)은 index 1 위치에 삽입합니다. 원본은 두번째 시트를 먼저 끝에 만든 뒤 세번째 시트를 위치 1에 넣고 제목을 바꿉니다. 결과가 ['타이틀 연습', '세번째 시트', '성적 관련 보고서']인 이유는 생성 변수 이름이 아니라 최종 시트 위치와 title 때문입니다.",
        "시트 선택은 wb['요약']처럼 제목으로 할 수 있고 wb.sheetnames로 현재 순서를 확인합니다. 제목이 없으면 KeyError가 발생합니다. 외부 파일에서는 사용자가 시트 이름을 바꿀 수 있으므로 무조건 첫 시트 또는 고정 이름을 믿지 말고, 필수 시트 목록을 검증하고 누락 시 어떤 오류를 줄지 결정합니다.",
        "Worksheet 제목은 Excel이 허용하는 길이와 금지 문자가 있습니다. 사용자 입력을 그대로 시트명에 쓰면 ValueError·경고 또는 충돌 이름이 생길 수 있습니다. 제어문자와 []:*?/\\ 같은 예약 문자를 정제하고 길이·중복 처리 정책을 둡니다. 표시 이름과 내부 식별자를 분리하면 이름 변경에도 코드가 덜 깨집니다.",
      ],
      concepts: [
        { term: "Worksheet", definition: "Workbook 안의 하나의 2차원 셀 격자와 시트 수준 설정을 가진 객체입니다.", detail: ["title로 식별되고 workbook 안에서 순서를 가집니다.", "같은 workbook 안에서 제목은 고유해야 합니다."] },
        { term: "active worksheet", definition: "workbook에서 현재 활성으로 표시되도록 선택된 worksheet입니다.", detail: ["wb.active로 가져올 수 있습니다.", "업무 데이터 시트를 뜻하는 강한 schema 계약은 아니므로 이름 검증이 더 안전합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "KeyError: 'Worksheet 요약 does not exist.'처럼 시트 선택이 실패한다.",
          likelyCause: "실제 sheetnames와 코드의 이름이 다르거나 사용자가 시트명을 바꿨거나 앞뒤 공백·대소문자가 다릅니다.",
          checks: ["print(wb.sheetnames)로 실제 제목과 순서를 확인합니다.", "repr로 보이지 않는 앞뒤 공백을 확인합니다.", "파일 버전별 필수 시트 schema가 다른지 확인합니다."],
          fix: "필수 시트가 없으면 명확한 입력 오류를 반환하거나 승인된 별칭 mapping으로 찾습니다. 무작정 wb.active로 대체해 잘못된 시트를 처리하지 않습니다.",
          prevention: "생성 코드와 읽기 코드가 공유하는 시트 schema 상수·버전 검증과 샘플 workbook 회귀 테스트를 둡니다.",
        },
      ],
    },
    {
      id: "cell-address-value-append",
      title: "Cell은 1-based 좌표와 값·타입·스타일을 함께 가집니다",
      lead: "ws['A1']과 ws.cell(row=1, column=1)는 같은 좌표를 가리키며, 행·열 번호는 Python list와 달리 1부터 시작합니다.",
      explanations: [
        "A1 표기에서 A는 열, 1은 행입니다. ws['A1'] = 'Hello'는 해당 Cell.value를 설정합니다. 같은 셀은 ws.cell(row=1, column=1, value='Hello')로도 접근할 수 있습니다. row=0 또는 column=0은 유효하지 않으므로 반복 index가 0부터 시작하면 원본처럼 i + 1로 변환합니다.",
        "ws.cell은 Cell 객체를 반환합니다. cell.coordinate는 A1, cell.row는 1, cell.column은 1, cell.value는 실제 Python 값입니다. 문자열은 data_type 's', 숫자는 'n', 수식 문자열은 'f' 등으로 저장될 수 있습니다. data_type 문자를 애플리케이션 도메인 타입으로 직접 노출하기보다 value와 업무 schema를 함께 검증합니다.",
        "ws.append(iterable)는 현재 다음 행에 값을 왼쪽부터 추가합니다. 원본은 sheet3.append([1,2,3,4,5,6,7,8,9])로 A1:I1 한 행을 만듭니다. dict를 append할 때 key를 열 문자 또는 index로 사용하는 별도 동작이 있으므로 입문 자료에서는 header 순서와 같은 list·tuple 행을 명시하는 편이 안전합니다.",
        "빈 셀의 value는 None입니다. 빈 문자열 '', 숫자 0, False와 구분해야 합니다. if not cell.value로 건너뛰면 유효한 0과 False까지 사라집니다. 원본 ex07_excel.py처럼 if cell.value is None을 사용하면 정말 비어 있는 셀만 제외합니다.",
      ],
      concepts: [
        { term: "Cell", definition: "Worksheet의 한 행·열 좌표에 속하며 value, data_type, style, 수식 등의 정보를 제공하는 객체입니다.", detail: ["주소 접근과 row/column 접근이 같은 Cell을 가리킬 수 있습니다.", "셀 객체를 접근하는 것만으로 in-memory worksheet에 셀이 생성될 수 있어 거대한 빈 격자를 무작정 순회하지 않습니다."] },
        { term: "1-based coordinate", definition: "Excel 행·열 번호가 1부터 시작하는 규칙입니다.", detail: ["A1은 row=1,column=1입니다.", "0-based Python index와 변환할 때 +1 위치를 명시합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "ValueError: Row or column values must be at least 1이 발생한다.",
          likelyCause: "range(5)의 첫 i=0을 그대로 ws.cell(row=i, column=i)에 전달했습니다.",
          checks: ["오류 시 row·column 값을 출력합니다.", "Python loop index와 Excel 좌표 기준을 구분합니다.", "헤더 행 포함 여부 때문에 필요한 offset이 1인지 2인지 확인합니다."],
          fix: "첫 행·열이면 i + 1을 사용하고, 헤더 다음 데이터 행이면 enumerate(rows, start=2)처럼 시작값을 의미 있게 지정합니다.",
          prevention: "row_number·column_number 같은 이름과 enumerate(start=...)로 좌표 기준을 코드에 드러냅니다.",
        },
      ],
    },
    {
      id: "create-style-date-formula",
      title: "값, 표시 형식, 스타일과 수식 문자열을 분리해 저장합니다",
      lead: "숫자·날짜·불리언은 Python 값으로 저장하고 number_format과 Font는 Excel 표시를 정합니다. 수식은 계산 결과가 아니라 수식 문자열로 기록됩니다.",
      explanations: [
        "Python date(2026, 7, 11)를 Cell.value에 넣으면 openpyxl은 Excel이 저장할 수 있는 날짜 값과 날짜 형식을 기록합니다. number_format = 'yyyy-mm-dd'는 화면 표시 모양을 명시합니다. 날짜를 '2026-07-11' 문자열로만 저장하면 사람이 보기에는 같아도 Excel 날짜 계산·정렬에서 텍스트로 취급될 수 있습니다.",
        "Font(bold=True), PatternFill, Alignment 같은 스타일 객체를 셀에 할당합니다. header row의 각 기존 Cell에 스타일을 적용해야 실제 셀 스타일이 저장됩니다. 행·열 dimension에 스타일을 주는 것과 이미 존재하는 모든 셀에 적용하는 것은 같지 않습니다. 반복되는 스타일은 NamedStyle을 검토해 스타일 조합 폭증을 줄입니다.",
        "'=IF(B2>=60,\"합격\",\"보완\")'처럼 =로 시작하는 개발자가 통제한 문자열을 셀에 할당하면 formula로 저장됩니다. openpyxl은 수식 문법을 Excel 계산 엔진처럼 실행하지 않습니다. 함수명은 Excel의 영어 이름과 쉼표 구분을 사용하는 것이 원칙이며, 실제 계산값은 Excel·LibreOffice 등 계산 가능한 프로그램이 파일을 열고 재계산해 저장해야 cache에 생깁니다.",
        "Excel은 timezone-aware datetime을 직접 지원하지 않으므로 시간대 정보를 제거한 datetime만 던져 넣는 식으로 의미를 잃지 않습니다. 운영 데이터는 UTC instant와 timezone 식별자를 별도 열에 저장하거나 명시된 지역 시간 정책으로 변환합니다. 날짜·시간의 실제 값, timezone 의미, 표시 number_format을 세 층으로 나눕니다.",
      ],
      concepts: [
        { term: "number format", definition: "셀의 저장 값은 유지하면서 Excel이 숫자·날짜·백분율을 화면에 표시하는 모양을 정하는 형식 코드입니다.", detail: ["0.125에 '0.0%'를 적용하면 표시가 12.5%가 될 수 있지만 value 자체가 문자열로 바뀌지 않습니다.", "날짜 serial을 datetime/date로 해석하는 데 스타일 정보가 사용될 수 있습니다."] },
        { term: "cell formula", definition: "=로 시작하며 Excel 계산 엔진이 해석하도록 xlsx에 저장되는 표현식입니다.", detail: ["openpyxl은 저장·읽기는 하지만 계산하지 않습니다.", "수식 텍스트와 마지막 계산 cache는 별개입니다."] },
      ],
      codeExamples: [
        {
          id: "openpyxl-create-workbook-style-date",
          title: "두 시트 workbook에 값·날짜·스타일·수식을 저장하고 재조회하기",
          language: "python",
          filename: "create_learning_report.py",
          purpose: "원본의 시트 생성, 주소·append 입력, 저장·close를 날짜·header style·수식까지 확장하고 실제 파일을 다시 열어 계약을 확인합니다.",
          code: `from datetime import date
from pathlib import Path
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font

path = Path("learning_report.xlsx")
wb = Workbook()
summary = wb.active
summary.title = "요약"
detail = wb.create_sheet("상세", 1)

summary.append(["과정", "점수", "학습일", "상태"])
summary.append(["Python", 90, date(2026, 7, 11), '=IF(B2>=60,"합격","보완")'])
detail.append(["세션", "완료"])
detail.append(["Excel 기초", True])
for cell in summary[1]:
    cell.font = Font(bold=True)
summary["C2"].number_format = "yyyy-mm-dd"

wb.save(path)
wb.close()

loaded = load_workbook(path, data_only=False)
ws = loaded["요약"]
print(loaded.sheetnames)
print([cell.value for cell in ws[1]])
print(ws["A2"].value, ws["B2"].value, ws["C2"].value.date().isoformat())
print(ws["D2"].value)
print(ws["A1"].font.bold, ws["C2"].number_format)
loaded.close()`,
          walkthrough: [
            { lines: "1-4", explanation: "날짜, 안전한 경로, workbook 입출력과 header 스타일 도구를 가져옵니다." },
            { lines: "6-10", explanation: "일반 Workbook의 기본 시트를 요약으로 이름 변경하고 상세 시트를 index 1에 추가합니다." },
            { lines: "12-15", explanation: "append로 행 단위 값을 넣습니다. date와 bool은 문자열이 아닌 Python 타입이고 D2는 통제된 formula 문자열입니다." },
            { lines: "16-18", explanation: "요약 첫 행의 실제 셀 각각에 bold Font를 적용하고 날짜 표시 형식을 고정합니다." },
            { lines: "20-21", explanation: "xlsx를 저장한 뒤 workbook을 명시적으로 닫습니다." },
            { lines: "23-29", explanation: "수식 보존 모드로 다시 열어 시트·범위·타입 변환·수식·스타일을 검증하고 닫습니다." },
          ],
          run: { environment: ["Python 3.11 이상", "openpyxl 3.1 이상 설치", "쓰기 가능한 빈 실습 폴더"], command: "python create_learning_report.py" },
          output: {
            value: `['요약', '상세']
['과정', '점수', '학습일', '상태']
Python 90 2026-07-11
=IF(B2>=60,"합격","보완")
True yyyy-mm-dd`,
            explanation: [
              "시트는 생성 위치 순서대로 요약·상세입니다.",
              "첫 행 범위를 순회하면 header 네 Cell의 value가 list로 나옵니다.",
              "날짜 셀은 재조회 시 datetime으로 읽혀 date 부분을 ISO 문자열로 표시했습니다.",
              "data_only=False라 D2는 계산값이 아니라 수식 텍스트입니다.",
              "저장 후에도 A1 bold와 C2 number_format이 유지됩니다.",
            ],
          },
          downloads: [
            {
              label: "두 시트 학습 보고서",
              filename: "learning_report.xlsx",
              href: "/samples/python/excel/learning_report.xlsx",
              description: "위 코드를 실행해 만든 요약·상세 시트 workbook입니다.",
              checks: ["요약!D2의 IF 수식", "요약 header의 굵은 글꼴과 C2 날짜 형식", "상세!B2의 불리언 값"],
            },
          ],
          experiments: [
            { change: "detail = wb.create_sheet('상세', 0)으로 위치를 바꿉니다.", prediction: "sheetnames는 ['상세', '요약']이 됩니다.", result: "create_sheet의 index가 최종 탭 순서를 결정하고 active 변수 이름과는 무관합니다." },
            { change: "C2에 '2026-07-11' 문자열을 넣고 type을 재조회합니다.", prediction: "datetime이 아니라 str로 읽힙니다.", result: "표시가 같은 날짜 텍스트와 실제 날짜 타입은 Excel 정렬·계산 의미가 다릅니다." },
          ],
          sourceRefs: ["py-day05-ex06", "py-day05-xlsx", "py-day05-note", "openpyxl-usage", "openpyxl-styles"],
        },
      ],
      diagnostics: [
        {
          symptom: "저장한 날짜가 숫자로 보이거나 정렬·계산이 예상과 다르다.",
          likelyCause: "Python date/datetime과 표시 number_format 중 하나가 누락됐거나 날짜를 일반 문자열로 저장했습니다.",
          checks: ["재조회한 cell.value의 type을 확인합니다.", "cell.number_format을 출력합니다.", "원본 입력이 timezone-aware인지와 workbook epoch를 확인합니다."],
          fix: "업무 의미에 맞는 date 또는 timezone 제거 정책을 거친 datetime을 저장하고 명시적 number_format을 적용합니다.",
          prevention: "저장→재조회 round-trip 테스트에서 값 타입·ISO 날짜·number_format을 모두 검증합니다.",
        },
      ],
      expertNotes: [
        "스타일 객체는 공유·중복 최적화 대상입니다. 셀마다 동적으로 수많은 서로 다른 Font를 만들면 파일 크기와 Excel style 한도에 영향을 줄 수 있습니다.",
        "표시 형식은 검증이 아닙니다. 숫자 형식을 적용해도 cell.value에 잘못된 문자열이 들어갈 수 있으므로 입력 schema를 별도로 검사합니다.",
      ],
    },
    {
      id: "range-iteration-none",
      title: "범위는 행 tuple의 tuple이며 빈 셀 정책을 명시합니다",
      lead: "ws['A1':'E4'] 또는 iter_rows는 행 단위로 Cell을 제공합니다. 순서는 위에서 아래, 각 행은 왼쪽에서 오른쪽입니다.",
      explanations: [
        "원본 ex07_excel.py에서 cells = ws['A1':'E4']는 4개 행을 만들고 각 행에는 A부터 E까지 5개의 Cell이 있습니다. 이중 for의 바깥 row는 1→4, 안쪽 cell은 A→E 순서입니다. 실제 출력은 A1 Hello World, B2 방가방가, E3 하이~~, A4 데이터 입력 연습 위치를 제외한 칸에 None을 보여 줍니다.",
        "범위를 값만 list로 바꾸려면 [[cell.value for cell in row] for row in cells]처럼 만들 수 있습니다. 그러나 큰 범위 전체를 list로 materialize하면 메모리가 늘어납니다. 한 번의 처리에는 ws.iter_rows(min_row=..., max_row=..., values_only=True)를 사용해 행 tuple을 순차 처리하는 편이 간결합니다. read_only 모드와 결합하면 큰 파일 메모리를 줄일 수 있습니다.",
        "빈 셀 None을 제외할지, 빈 값으로 보존할지, 오류로 볼지는 업무 schema에 달려 있습니다. 표의 열 위치가 중요하면 None을 제거하면 열 정렬이 무너집니다. 원본 t_list처럼 비어 있지 않은 값 전체만 평탄화하는 목적에는 is None continue가 맞지만, 행 기반 데이터 import에는 None을 그대로 유지하고 필수 열별 검증을 하는 편이 안전합니다.",
        "max_row와 max_column은 업무 데이터의 정확한 경계를 항상 뜻하지 않습니다. 과거에 값이나 스타일이 있었던 셀이 dimension을 넓힐 수 있고, 외부 생성 도구가 read_only dimension metadata를 잘못 기록할 수 있습니다. 필수 header와 sentinel 열을 기준으로 실제 데이터 종료 정책을 설계합니다.",
      ],
      concepts: [
        { term: "cell range", definition: "A1:E4처럼 사각형 좌표 구간에 포함된 Cell들을 행 단위로 제공하는 영역입니다.", detail: ["시작·끝 좌표를 모두 포함합니다.", "각 row는 Cell tuple이고 값을 얻으려면 cell.value를 읽습니다."] },
        { term: "values_only", definition: "iter_rows/iter_cols에서 Cell 객체 대신 value만 반환하도록 하는 선택입니다.", detail: ["스타일·좌표가 필요 없을 때 객체 접근을 줄입니다.", "None·날짜·수식/cache 값은 workbook 로딩 모드에 따라 그대로 나타납니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "빈 셀을 제거한 뒤 각 행의 이름·점수·날짜 열이 서로 당겨져 잘못 매핑된다.",
          likelyCause: "행 schema가 필요한데 모든 None을 평탄화·제거해 열 위치 정보를 잃었습니다.",
          checks: ["원본 coordinate와 value를 함께 출력합니다.", "헤더 열 수와 각 row tuple 길이를 비교합니다.", "빈 값 허용 열과 필수 열을 구분합니다."],
          fix: "행 단위 tuple의 None 위치를 보존하고 header와 zip하거나 열 index별로 검증합니다. 전체 non-empty 값 수집은 별도 목적에서만 사용합니다.",
          prevention: "범위 읽기 함수의 반환 계약을 flat values가 아니라 rows/records 중 하나로 명확히 이름 붙입니다.",
        },
      ],
    },
    {
      id: "formula-data-only-cache",
      title: "data_only는 수식을 계산하지 않고 마지막 저장 cache를 선택합니다",
      lead: "같은 xlsx를 data_only=False로 열면 formula text, True로 열면 Excel이 마지막으로 저장한 계산값 cache를 읽습니다.",
      explanations: [
        "load_workbook(path, data_only=False)는 기본 동작이며 formula Cell.value에 '=SUM(A1:B2)' 같은 수식 문자열을 제공합니다. 수식을 분석·복사·보존하려면 이 모드를 사용합니다. data_only=True는 수식 대신 workbook 안에 저장된 cached result를 요청합니다. 이름의 data_only가 ‘데이터를 새로 계산한다’는 뜻은 아닙니다.",
        "openpyxl로 새 수식을 작성하고 바로 저장한 파일에는 계산 engine이 만든 cache가 없습니다. 실제 감사에서 A1:B2 숫자와 C1 '=SUM(A1:B2)'를 저장한 뒤 data_only=False는 수식, data_only=True는 None을 반환했습니다. Excel에서 재계산해 저장하면 cache가 들어갈 수 있지만 계산 설정·외부 링크·Excel 버전에 따라 오래된 값일 수도 있습니다.",
        "정확한 최신 계산값이 업무 필수라면 선택지가 세 가지입니다. Python에서 같은 계산을 직접 수행해 값으로 저장하거나, Excel 계산 engine이 있는 신뢰 환경에서 재계산·저장한 뒤 읽거나, 수식과 cache의 생성 시각·원본 버전을 검증합니다. data_only=True 하나로 최신성을 보장하지 않습니다.",
        "같은 Workbook 객체에서 formula view와 cached value view를 동시에 얻는 옵션은 아닙니다. 두 모드를 비교하려면 파일을 두 번 load하고 각각 close합니다. 큰 파일이면 I/O 비용이 두 배가 되므로 실제 요구가 수식인지 값인지 먼저 결정합니다.",
      ],
      concepts: [
        { term: "data_only", definition: "수식 셀을 읽을 때 formula text 대신 파일에 저장된 마지막 계산 result cache를 반환하도록 요청하는 load_workbook 옵션입니다.", detail: ["False는 수식, True는 cache입니다.", "cache가 없으면 None, 오래됐으면 오래된 값일 수 있습니다."] },
        { term: "formula cache", definition: "Excel 같은 계산 프로그램이 수식을 계산한 뒤 workbook에 함께 저장할 수 있는 마지막 결과 값입니다.", detail: ["openpyxl 자체는 일반적으로 수식을 계산해 cache를 갱신하지 않습니다.", "최신성은 계산·저장 주체와 시점의 계약입니다."] },
      ],
      codeExamples: [
        {
          id: "openpyxl-formula-data-only-range",
          title: "같은 수식 셀을 formula 모드와 cache 모드로 읽기",
          language: "python",
          filename: "formula_cache_check.py",
          purpose: "openpyxl이 새로 작성한 수식을 계산하지 않으며 data_only=True에서 cache 부재가 None으로 나타나는 사실을 범위 읽기와 함께 재현합니다.",
          code: `from pathlib import Path
from openpyxl import Workbook, load_workbook

path = Path("formula_cache.xlsx")
wb = Workbook()
ws = wb.active
ws.title = "계산"
ws.append([10, 20])
ws.append([30, 40])
ws["C1"] = "=SUM(A1:B2)"
wb.save(path)
wb.close()

formula_wb = load_workbook(path, read_only=True, data_only=False)
value_wb = load_workbook(path, read_only=True, data_only=True)
print(formula_wb["계산"]["C1"].value)
print(value_wb["계산"]["C1"].value)
print([[cell.value for cell in row] for row in formula_wb["계산"].iter_rows(min_row=1, max_row=2, min_col=1, max_col=2)])
formula_wb.close()
value_wb.close()`,
          walkthrough: [
            { lines: "1-3", explanation: "경로와 workbook 생성·로딩 API를 준비합니다." },
            { lines: "5-12", explanation: "2×2 숫자 범위와 SUM formula를 저장합니다. 이 과정은 formula 계산 engine을 실행하지 않습니다." },
            { lines: "14-15", explanation: "같은 파일을 수식 보존 view와 cached value view로 각각 read_only 로딩합니다." },
            { lines: "16", explanation: "data_only=False의 C1은 formula text를 반환합니다." },
            { lines: "17", explanation: "새 파일에는 계산 cache가 없어 data_only=True의 C1은 None입니다." },
            { lines: "18", explanation: "iter_rows로 A1:B2 실제 숫자 값을 행 순서대로 읽습니다." },
            { lines: "19-20", explanation: "read_only workbook의 파일 handle을 둘 다 명시적으로 닫습니다." },
          ],
          run: { environment: ["Python 3.11 이상", "openpyxl 3.1 이상", "쓰기 가능한 실습 폴더"], command: "python formula_cache_check.py" },
          output: {
            value: `=SUM(A1:B2)
None
[[10, 20], [30, 40]]`,
            explanation: [
              "첫 줄은 저장된 수식 문자열입니다.",
              "둘째 None은 합계가 비어 있다는 뜻이 아니라 계산 cache가 없다는 뜻입니다.",
              "숫자 범위는 수식 모드와 무관하게 저장된 값 그대로 읽힙니다.",
            ],
          },
          downloads: [
            {
              label: "수식과 계산 캐시 비교",
              filename: "formula_cache.xlsx",
              href: "/samples/python/excel/formula_cache.xlsx",
              description: "A1:B2의 숫자와 C1의 SUM 수식을 함께 저장한 비교용 workbook입니다.",
              checks: ["계산!C1의 =SUM(A1:B2) 수식", "data_only=False의 수식 문자열", "새로 작성한 파일에서 data_only=True 캐시가 None인 이유"],
            },
          ],
          experiments: [
            { change: "C1 수식 대신 Python에서 sum([10,20,30,40]) 결과 100을 저장합니다.", prediction: "두 data_only 모드 모두 100을 읽습니다.", result: "값 셀은 formula/cache 선택 대상이 아니며 최신 계산을 Python이 책임진 경우 명확합니다." },
            { change: "파일을 Excel에서 열어 재계산·저장한 뒤 다시 data_only=True로 읽습니다.", prediction: "환경이 formula를 계산·cache 저장했다면 100이 나옵니다.", result: "계산 주체·설정에 의존하므로 자동화 테스트에서는 cache 존재와 계산 시점을 별도로 검증해야 합니다." },
          ],
          sourceRefs: ["py-day05-ex07", "py-day05-note", "openpyxl-tutorial", "openpyxl-optimized"],
        },
      ],
      diagnostics: [
        {
          symptom: "Excel 화면에는 수식 결과가 보이는데 data_only=True에서 None 또는 이전 값이 나온다.",
          likelyCause: "파일에 formula cache가 저장되지 않았거나 마지막 계산 뒤 저장되지 않았거나 cache가 오래됐습니다.",
          checks: ["data_only=False로 같은 셀의 formula text를 확인합니다.", "파일을 마지막으로 계산·저장한 프로그램과 시각을 확인합니다.", "Excel 계산 모드가 수동인지, 외부 workbook link가 있는지 확인합니다."],
          fix: "신뢰할 계산 엔진에서 재계산·저장하거나 Python에서 공식 계산 로직을 수행해 값으로 저장합니다. None을 0으로 조용히 대체하지 않습니다.",
          prevention: "수식 workbook의 생산 파이프라인에 재계산·저장 단계와 cache freshness 검증을 명시합니다.",
        },
      ],
      expertNotes: [
        "formula 문자열을 신뢰 경계 밖에서 받아 셀에 그대로 넣지 않습니다. 계산식은 애플리케이션이 통제하고 입력은 값 셀로 분리합니다.",
        "외부 link cache와 volatile formula는 재현성을 더 어렵게 하므로 보고서 생성은 가능한 한 입력 snapshot과 Python 계산 결과를 함께 보존합니다.",
      ],
    },
    {
      id: "optimized-read-write-modes",
      title: "read_only와 write_only는 메모리를 줄이는 대신 기능을 제한합니다",
      lead: "큰 xlsx에서는 일반 모드의 모든 Cell 객체를 메모리에 만드는 비용이 커집니다. 최적화 모드는 사용 패턴을 스트리밍으로 바꿉니다.",
      explanations: [
        "load_workbook(path, read_only=True)는 worksheet 내용을 lazy하게 읽습니다. 반환 셀은 일반 Cell이 아니라 ReadOnlyCell 계열이고 값을 수정할 수 없습니다. 행을 순서대로 처리하는 import·검증에는 적합하지만 임의 셀 편집·저장 목적에는 일반 모드가 필요합니다. 파일 handle을 유지하므로 작업이 끝나면 wb.close()를 명시합니다.",
        "read_only는 파일이 기록한 worksheet dimension metadata에 의존합니다. 외부 생성기가 실제 데이터보다 A1:A1처럼 잘못 기록하면 calculate_dimension으로 확인하고 필요 시 reset_dimensions를 검토합니다. 무조건 reset하는 것이 아니라 알고 있는 schema·header와 실제 행을 비교한 뒤 사용합니다.",
        "Workbook(write_only=True)는 기본 worksheet가 없습니다. wb.create_sheet()로 반드시 시트를 만들고 ws.append(row)로 행을 순서대로 추가합니다. ws['A1'] 임의 접근이나 읽기·수정은 불가능합니다. freeze_panes처럼 셀 데이터보다 먼저 직렬화돼야 하는 설정은 row append 전에 지정합니다.",
        "write_only workbook은 한 번만 save할 수 있고 저장 뒤 append·재저장이 불가능합니다. style이나 comment가 필요하면 WriteOnlyCell을 만들어 append 행에 넣습니다. 무제한이라는 표현을 실제 Excel 행·열 한도와 혼동하지 않고, 생성하는 파일의 consumer 한도와 디스크 공간을 검증합니다.",
      ],
      concepts: [
        { term: "read_only mode", definition: "기존 workbook의 worksheet를 lazy 스트리밍하며 메모리 사용을 줄이는 읽기 전용 모드입니다.", detail: ["ReadOnlyCell을 행 순서로 읽습니다.", "명시적 close가 필요하고 편집 기능은 제한됩니다."] },
        { term: "write_only mode", definition: "행을 순서대로 직렬화해 큰 workbook을 낮은 메모리로 한 번 생성하는 모드입니다.", detail: ["기본 시트가 없어 create_sheet가 필요합니다.", "append 중심이고 임의 접근·재저장이 불가능합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "read_only worksheet의 cell.value를 바꾸려다 AttributeError가 발생하거나 저장할 수 없다.",
          likelyCause: "메모리 절약 읽기 전용 모드에서 일반 편집 API를 사용했습니다.",
          checks: ["wb.read_only 값을 확인합니다.", "cell class 이름이 ReadOnlyCell인지 봅니다.", "요구가 스트리밍 변환인지 기존 파일 직접 수정인지 구분합니다."],
          fix: "수정이 필요하면 일반 load_workbook으로 열거나 read_only로 읽어 새 write_only workbook에 변환 결과를 작성합니다.",
          prevention: "함수 이름·타입·문서에서 read stream과 editable workbook 책임을 분리합니다.",
        },
        {
          symptom: "write_only workbook을 두 번째 save하거나 save 뒤 append할 때 WorkbookAlreadySaved가 발생한다.",
          likelyCause: "write_only는 순차 단일 저장 스트림인데 일반 workbook처럼 반복 저장하려 했습니다.",
          checks: ["Workbook(write_only=True) 사용 여부를 확인합니다.", "save 호출 위치와 예외 뒤 retry 흐름을 찾습니다.", "모든 시트 설정이 append 전에 완료됐는지 봅니다."],
          fix: "새 Workbook을 다시 만들고 데이터 source를 처음부터 재생성하거나, 반복 저장이 필요하면 일반 모드를 선택합니다.",
          prevention: "write-only 생성 함수를 one-shot operation으로 만들고 save를 최상위 한 곳에서만 호출합니다.",
        },
      ],
      comparisons: [
        {
          title: "워크북 모드를 어떻게 선택할까요?",
          options: [
            { name: "일반 모드", chooseWhen: "작거나 중간 크기 파일을 임의 셀 편집·스타일·검증·재저장할 때", avoidWhen: "수백만 셀을 단순 순차 처리해 메모리가 병목일 때", tradeoffs: ["기능과 random access가 풍부합니다.", "Cell 객체 전체가 큰 메모리를 쓸 수 있습니다."] },
            { name: "read_only", chooseWhen: "큰 기존 xlsx를 한 번 행 순서로 읽을 때", avoidWhen: "기존 셀 수정·저장이 필요할 때", tradeoffs: ["lazy load로 시작과 메모리 비용을 줄입니다.", "명시 close·dimension metadata·기능 제한을 관리해야 합니다."] },
            { name: "write_only", chooseWhen: "큰 새 xlsx를 row stream으로 한 번 내보낼 때", avoidWhen: "임의 셀 수정·재저장·뒤늦은 시트 설정이 필요할 때", tradeoffs: ["낮은 메모리로 append할 수 있습니다.", "시트를 직접 만들고 한 번만 저장하며 API가 제한됩니다."] },
          ],
        },
      ],
      expertNotes: [
        "큰 파일 테스트는 셀 수·문자열 비율·style 수·디스크 I/O를 실제 운영 규모에 맞추고 파일 크기만으로 메모리를 추정하지 않습니다.",
        "read_only workbook을 여러 process에서 별도 열 수 있어도 같은 파일 handle·Workbook 객체를 process 간 공유하지 않습니다.",
      ],
    },
    {
      id: "resource-close-atomic-save",
      title: "저장은 임시 파일을 완성한 뒤 같은 볼륨에서 교체합니다",
      lead: "wb.save(target)는 target을 직접 쓰므로 중간 실패·프로세스 종료·파일 잠금 때 결과가 불완전할 수 있습니다. 원본을 지켜야 하면 별도 파일에서 완성·검증합니다.",
      explanations: [
        "읽기용 Workbook, 특히 read_only 모드는 내부 ZIP file handle을 유지하므로 finally에서 close합니다. 쓰기 Workbook도 저장 성공·실패와 무관하게 close하는 일관된 수명 정책을 사용합니다. Python 파일 객체의 with와 달리 Workbook이 모든 버전에서 일반 context manager라고 가정하지 않고 try/finally를 명시합니다.",
        "중요 파일을 같은 target에 바로 save하면 저장 중 예외로 기존 파일이 손상될 수 있습니다. target과 같은 디렉터리에 임시 .xlsx를 만들고 wb.save(temp)를 완료한 뒤 os.replace(temp, target)로 교체하면 같은 filesystem에서 독자가 부분 ZIP을 보는 창을 줄이고 기존 파일을 마지막 단계까지 보존할 수 있습니다.",
        "원자적 이름 교체는 데이터베이스 transaction이나 전원 장애 durability 전체를 보장하지 않습니다. 같은 볼륨이어야 하고 Windows에서 target이 Excel에 의해 열려 있으면 PermissionError가 날 수 있습니다. 핵심 보고서는 교체 전 temp를 load_workbook(read_only=True)로 열어 필수 시트·header를 검증하고 backup·복구 정책을 둡니다.",
        "동시에 두 process가 같은 target을 만들면 마지막 교체가 앞 결과를 덮어쓸 수 있습니다. 파일 lock, job별 고유 output, versioned 이름, 단일 writer queue 중 하나를 선택합니다. ‘원자 교체’와 ‘동시 update 충돌 방지’는 서로 다른 문제입니다.",
      ],
      concepts: [
        { term: "atomic replacement", definition: "완성된 임시 파일을 같은 filesystem에서 최종 경로로 한 번에 이름 교체해 부분 파일 노출을 줄이는 저장 패턴입니다.", detail: ["임시 파일은 target과 같은 디렉터리에 둡니다.", "교체 전 파일 내용 검증과 실패 시 임시 파일 정리가 필요합니다."], caveat: "프로세스 간 lost update, fsync 기반 durability, backup을 자동 해결하지 않습니다." },
        { term: "resource lifetime", definition: "Workbook과 내부 archive handle을 열고 사용하는 범위와 반드시 닫는 시점을 관리하는 계약입니다.", detail: ["read_only는 lazy 읽기 동안 handle이 필요합니다.", "예외 경로에서도 close가 실행되도록 finally를 사용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "PermissionError: [Errno 13] Permission denied가 save 또는 os.replace에서 발생한다.",
          likelyCause: "대상 xlsx를 Excel이 열어 잠갔거나 디렉터리 쓰기 권한이 없거나 antivirus·동기화 도구가 파일을 점유했습니다.",
          checks: ["Excel·미리보기에서 파일이 열려 있는지 확인합니다.", "같은 디렉터리에 작은 새 파일을 만들 권한이 있는지 확인합니다.", "target과 temp가 같은 볼륨인지와 동시 writer가 있는지 봅니다."],
          fix: "파일을 닫고 권한 있는 경로를 사용하며 충돌 시 기존 파일을 덮지 않고 새 버전 이름으로 안전하게 실패합니다.",
          prevention: "출력 파일 수명·잠금 안내, 고유 job 이름, 재시도 상한과 사용자 복구 메시지를 설계합니다.",
        },
      ],
      expertNotes: [
        "정말 crash-durable해야 하면 temp file과 디렉터리 metadata의 fsync 정책을 운영체제별로 검토합니다. os.replace만으로 전원 장애 내구성을 단정하지 않습니다.",
        "원본 workbook을 수정하는 작업은 원본 hash·backup·검증된 temp·교체·감사 로그를 단계별로 남깁니다.",
      ],
    },
    {
      id: "formula-injection-safe-export",
      title: "불신 문자열을 수식으로 승격시키지 않습니다",
      lead: "사용자 이름·메모·CSV 값이 =로 시작할 수 있습니다. 이를 formula로 저장하면 workbook을 여는 사람의 spreadsheet 프로그램이 공격자가 만든 계산을 실행할 수 있습니다.",
      explanations: [
        "openpyxl에서 cell.value에 '=2+2'를 직접 할당하면 formula data_type으로 저장됩니다. 애플리케이션이 통제한 합계 수식에는 의도한 동작이지만, 사용자 입력을 그대로 쓰면 formula injection 경계가 됩니다. 특히 HYPERLINK·외부 참조와 spreadsheet 경고 유도는 정보 노출과 사회공학 위험이 될 수 있습니다.",
        "직접 xlsx는 셀 타입을 명시할 수 있어 CSV와 동일하지 않지만, export 데이터가 CSV로 재저장되거나 다른 spreadsheet 도구로 이동하는 경우 =, +, -, @, tab·newline 같은 시작 문자를 함께 검토합니다. OWASP도 spreadsheet 소비자와 재저장 동작에 따라 완전한 범용 sanitization 전략이 없음을 경고합니다.",
        "이 세션 예제는 사람이 보는 text-only export 정책으로 위험 시작 문자 앞에 apostrophe를 붙여 openpyxl이 formula가 아닌 string data_type 's'로 기록하게 합니다. 이 방식은 실제 데이터에 접두 문자를 추가하는 정책이며 downstream import에 영향을 줄 수 있습니다. 더 강한 설계는 신뢰된 formula 열과 불신 text 열을 schema로 분리하고, export consumer별 규칙과 회귀 파일을 테스트하는 것입니다.",
        "formula injection 방지와 path·파일 보안도 분리합니다. 출력 파일 이름에 사용자 입력을 직접 결합하지 않고 Path name allowlist와 기준 디렉터리를 사용합니다. 로그에는 셀 전체 민감 내용을 남기지 않고 행 번호·열 이름·위험 분류만 기록합니다.",
      ],
      concepts: [
        { term: "formula injection", definition: "불신 입력이 spreadsheet formula로 해석되도록 export되어 파일을 여는 사용자의 프로그램에서 의도하지 않은 계산·외부 접근을 유도하는 문제입니다.", detail: ["= 시작 문자열은 openpyxl에서 formula로 분류될 수 있습니다.", "CSV와 직접 xlsx의 셀 타입은 다르므로 실제 consumer를 기준으로 방어합니다."] },
        { term: "text-only export policy", definition: "사용자 제공 열을 formula가 아닌 literal text로 저장하고 위험 접두사·제어문자를 명시적으로 처리하는 schema 정책입니다.", detail: ["신뢰된 수식 열과 분리합니다.", "값 변경·표시·재가공 trade-off를 문서화합니다."] },
      ],
      codeExamples: [
        {
          id: "openpyxl-safe-text-atomic-save",
          title: "불신 텍스트를 문자열 셀로 만들고 임시 파일을 원자 교체하기",
          language: "python",
          filename: "safe_excel_export.py",
          purpose: "formula 시작 문자를 text 정책으로 변환하고, 같은 디렉터리 임시 xlsx를 완성한 뒤 os.replace하는 저장 경계를 재현합니다.",
          code: `import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from openpyxl import Workbook, load_workbook


def spreadsheet_text(value):
    text = str(value)
    if text.startswith(("=", "+", "-", "@", "\\t", "\\r", "\\n")):
        return "'" + text
    return text


def atomic_save(workbook, target):
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=target.parent, suffix=".xlsx", delete=False) as handle:
        temp_path = Path(handle.name)
    try:
        workbook.save(temp_path)
        os.replace(temp_path, target)
    finally:
        workbook.close()
        temp_path.unlink(missing_ok=True)


target = Path("safe_export.xlsx")
wb = Workbook()
ws = wb.active
ws.title = "입력"
for value in ["=2+2", "+10", "정상"]:
    ws.append([spreadsheet_text(value)])
atomic_save(wb, target)

loaded = load_workbook(target, data_only=False)
print(target.name, target.exists())
for cell in loaded["입력"]["A1":"A3"]:
    print(cell[0].data_type, cell[0].value)
loaded.close()`,
          walkthrough: [
            { lines: "1-4", explanation: "원자 교체·같은 디렉터리 temp·xlsx 생성과 검증 API를 가져옵니다." },
            { lines: "7-11", explanation: "text-only 정책에서 spreadsheet 위험 시작 문자를 발견하면 apostrophe를 실제 값 앞에 추가합니다. 범용 보안 함수가 아니라 이 export의 명시 정책입니다." },
            { lines: "14-25", explanation: "target과 같은 디렉터리에서 닫힌 임시 파일 이름을 얻고 workbook을 완전히 저장한 뒤 os.replace합니다. 성공·실패 모두 close와 남은 temp 정리를 수행합니다." },
            { lines: "28-34", explanation: "세 합성 입력을 한 열에 쓰고 원자 저장합니다." },
            { lines: "35-39", explanation: "재조회해 파일 존재, 각 셀 data_type과 실제 저장 value를 확인한 뒤 닫습니다." },
          ],
          run: { environment: ["Python 3.11 이상", "openpyxl 3.1 이상", "다른 프로그램이 target을 열고 있지 않은 실습 폴더"], command: "python safe_excel_export.py" },
          output: {
            value: `safe_export.xlsx True
s '=2+2
s '+10
s 정상`,
            explanation: [
              "임시 저장과 교체가 끝나 최종 파일이 존재합니다.",
              "세 셀 data_type은 모두 s라 formula가 아니라 문자열입니다.",
              "위험 두 값에는 정책상 실제 apostrophe가 추가됐고 정상 값은 바뀌지 않았습니다.",
            ],
          },
          downloads: [
            {
              label: "수식 주입 방지 내보내기",
              filename: "safe_export.xlsx",
              href: "/samples/python/excel/safe_export.xlsx",
              description: "불신 입력이 Excel 수식으로 실행되지 않도록 문자열로 저장한 보안 예제입니다.",
              checks: ["입력!A1의 '=2+2 문자열", "입력!A2의 '+10 문자열", "세 셀 모두 formula가 아닌 문자열 타입"],
            },
          ],
          experiments: [
            { change: "spreadsheet_text를 거치지 않고 ws.append(['=2+2'])를 실행합니다.", prediction: "재조회한 cell.data_type이 f이고 value는 =2+2입니다.", result: "openpyxl은 = 시작 문자열을 formula로 분류하므로 불신 입력과 통제된 formula를 schema에서 분리해야 합니다." },
            { change: "os.replace 직전에 load_workbook(temp_path, read_only=True)로 필수 시트·header를 검증합니다.", prediction: "깨진 temp라면 원본 target을 교체하기 전에 실패합니다.", result: "저장 성공만이 아니라 최소 구조 read-back을 원자 교체 전 품질 gate로 둘 수 있습니다." },
          ],
          sourceRefs: ["py-day05-ex06", "py-day05-note", "openpyxl-tutorial", "owasp-formula-injection"],
        },
      ],
      diagnostics: [
        {
          symptom: "사용자 메모 '=HYPERLINK(...)'를 저장한 셀이 formula data_type f로 나타난다.",
          likelyCause: "불신 text와 개발자가 통제한 formula를 같은 할당 경로로 처리해 = 시작 값을 수식으로 승격했습니다.",
          checks: ["재조회한 cell.data_type과 value를 확인합니다.", "해당 열이 text-only인지 formula 허용 열인지 schema를 확인합니다.", "CSV·xlsx·재저장 등 최종 소비 경로를 확인합니다."],
          fix: "text-only 열에는 검증·정규화 정책을 적용해 string으로 저장하고 formula는 승인된 template에서만 생성합니다. 이미 생성된 파일은 안전한 환경에서 검사 후 폐기·재생성합니다.",
          prevention: "위험 접두사·제어문자 테스트, formula cell allowlist, 결과 workbook data_type 감사를 자동화합니다.",
        },
      ],
      expertNotes: [
        "apostrophe prefix는 데이터 변경이며 모든 spreadsheet·재저장 경로에 보편적인 해답이 아닙니다. 최종 consumer별 테스트와 구조화된 formula allowlist가 핵심입니다.",
        "formula·external link·macro가 포함된 workbook은 신뢰 수준을 표시하고 일반 사용자에게 열도록 배포하기 전에 별도 정적·동적 검사를 거칩니다.",
      ],
    },
    {
      id: "independent-checkpoint",
      title: "워크북 작업은 schema→값→표시→계산→저장 순서로 검증합니다",
      lead: "셀 몇 개가 화면에 보인다는 사실만으로 데이터 파일이 정확하고 안전하다고 결론 내리지 않습니다.",
      explanations: [
        "먼저 workbook schema를 정합니다. 필수 sheet 제목과 순서, header, 열 타입, 빈 값 허용, formula 허용 열, 날짜·timezone 정책을 문서화합니다. Workbook·Worksheet·Cell 객체를 만드는 코드는 그 schema를 구현합니다. active index와 max_row 같은 우연한 상태를 업무 계약으로 쓰지 않습니다.",
        "값과 표시를 분리합니다. 점수는 int, 학습일은 date/datetime, 완료 여부는 bool로 저장하고 Font·number_format은 화면 표현을 정합니다. 범위는 row 구조를 보존해 None 위치를 검증합니다. formula는 openpyxl이 계산하지 않으므로 formula text와 cached result, 계산 주체·시각을 따로 관리합니다.",
        "데이터 크기에 따라 일반·read_only·write_only를 선택하고 모든 열린 Workbook을 닫습니다. 중요한 output은 같은 디렉터리 temp에 완성·read-back 검증한 뒤 교체합니다. 불신 text는 formula가 될 수 없게 하고 경로·로그·동시 writer를 분리해 보호합니다. 이 순서를 코드·테스트·운영 문서에서 재현할 수 있으면 다음 데이터 자동화 단계로 넘어갈 준비가 됐습니다.",
      ],
      concepts: [],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "xlsx 결과를 검증하는 수준을 어떻게 선택할까요?",
          options: [
            { name: "값 read-back", chooseWhen: "일반 데이터 export의 자동 테스트 기본선", avoidWhen: "수식 계산·시각 레이아웃까지 보장해야 하는데 이것만으로 충분하다고 볼 때", tradeoffs: ["빠르고 CI에서 재현 가능합니다.", "Excel 계산·렌더링 결과는 확인하지 않습니다."] },
            { name: "Excel/LibreOffice 재계산·시각 검증", chooseWhen: "formula cache, 차트, 인쇄 레이아웃이 납품 계약일 때", avoidWhen: "순수 데이터 workbook에 무거운 GUI 자동화를 불필요하게 추가할 때", tradeoffs: ["실제 consumer 결과를 검증합니다.", "환경·버전·라이선스·자동화 안정성 비용이 큽니다."] },
          ],
        },
      ],
      expertNotes: [
        "골든 workbook 회귀 테스트는 OOXML 내부 생성 순서·metadata 때문에 binary hash만 비교하면 불안정할 수 있습니다. sheet·cell·style·formula의 의미를 추출해 비교합니다.",
        "사용자에게 전달하는 파일은 생성 버전, 데이터 기준 시각, 계산 주체, formula 포함 여부와 개인정보 등급을 문서 속성·동봉 메타데이터에 남깁니다.",
      ],
    },
  ],
  lab: {
    title: "안전한 학습 성적 workbook 생성·검증 파이프라인",
    scenario: "합성 학습 기록으로 요약·상세·오류 시트를 만들고 타입·스타일·수식·범위를 검증한 뒤, 불신 텍스트를 보호하고 원자적으로 최종 파일을 교체합니다.",
    setup: [
      "Python 3.11 이상과 openpyxl 3.1 이상을 준비하고 버전을 기록합니다.",
      "빈 실습 폴더에 output 디렉터리를 만들고 실제 개인정보 대신 둘리·도우너 같은 합성 record를 준비합니다.",
      "필수 sheet ['요약','상세','오류'], header, 열 타입, 합격 기준, formula 허용 열과 text-only 열을 표로 정의합니다.",
    ],
    steps: [
      "Workbook을 만들고 기본 sheet를 요약으로 바꾼 뒤 상세·오류를 지정 순서에 추가합니다.",
      "각 시트 header를 append하고 NamedStyle 또는 공유 Font·Fill·Alignment를 적용합니다.",
      "상세 시트에 str 이름, int 점수, date 학습일, bool 완료를 넣고 날짜 number_format을 고정합니다.",
      "요약 시트 formula 열에는 애플리케이션이 통제한 COUNTIF·AVERAGE 수식만 넣고 사용자 입력은 text-only 변환합니다.",
      "오류 시트에는 원본 전체가 아닌 row 번호·열·오류 코드만 저장해 개인정보 노출을 줄입니다.",
      "같은 디렉터리 temp xlsx에 저장하고 read_only/data_only=False로 필수 시트·header·Cell 타입·formula allowlist를 검증합니다.",
      "data_only=True view에서 새 formula cache가 None일 수 있음을 기록하고 0으로 대체하지 않습니다.",
      "검증 성공 뒤 os.replace로 final path를 교체하고 모든 Workbook을 finally에서 닫습니다.",
      "작은 파일은 일반 모드, 10만 행 합성 파일은 write_only로 생성해 API 차이와 메모리를 비교합니다.",
      "빈 입력, None, 0, False, = 시작 이름, 중복 sheet 이름, 잠긴 target, 깨진 xlsx를 실패 테스트합니다.",
    ],
    expectedResult: [
      "세 시트가 schema 순서와 제목으로 존재하고 각 header·data type·날짜 format이 재조회됩니다.",
      "A1 주소와 iter_rows 범위가 같은 값을 제공하고 None이 열 위치를 잃지 않은 채 처리됩니다.",
      "formula view에는 수식, 새 data_only view에는 cache 부재 None이 나타나며 이유가 문서화됩니다.",
      "불신 = 시작 값은 승인 formula 셀 밖에서 data_type s로 저장됩니다.",
      "실패 시 기존 final 파일이 유지되고 temp가 정리되며 workbook handle이 닫힙니다.",
      "write_only 버전은 create_sheet+append+single save만 사용합니다.",
    ],
    cleanup: ["실습 파일은 합성 데이터임을 표시하고 output 폴더만 정리합니다.", "잠금 테스트에 사용한 Excel·미리보기 창을 닫습니다.", "formula injection 합성 값은 실제 링크·명령이 아닌 =2+2 같은 무해한 문자열만 사용합니다."],
    extensions: [
      "Excel에서 재계산·저장한 복사본과 openpyxl-only 파일의 formula cache를 비교합니다.",
      "freeze panes, auto filter, column width와 print area를 schema에 추가하고 시각 검증 기준을 만듭니다.",
      "versioned output과 manifest JSON에 파일 hash·행 수·생성 시각·openpyxl 버전을 기록합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본 구조를 재현해 세 시트 workbook을 만들고 A1:E4 범위를 읽으세요.",
      requirements: ["기본 시트 이름 변경, 시트 끝 추가, index 1 삽입을 모두 사용합니다.", "주소, ws.cell, append 세 입력 방식을 각각 한 번 이상 사용합니다.", "저장 후 새 Workbook으로 열어 sheetnames와 non-None cell coordinate/value를 출력합니다.", "모든 Workbook을 close합니다."],
      hints: ["행·열 번호는 1부터입니다.", "빈 셀은 cell.value is None으로 구분하세요."],
      expectedOutcome: "원본과 같은 시트 순서와 네 non-empty 첫 시트 값, 대각선·행 append 값을 실제 xlsx에서 재조회합니다.",
      solutionOutline: ["Workbook과 세 Worksheet를 구성합니다.", "원본 좌표에 합성 값을 씁니다.", "임시 path에 save·close합니다.", "load_workbook과 iter_rows로 검증합니다."],
    },
    {
      difficulty: "응용",
      prompt: "날짜·스타일·수식이 있는 학습 요약을 만들고 formula/cache 두 view를 비교하세요.",
      requirements: ["header bold·fill, date number_format, 점수 int, 완료 bool을 저장합니다.", "통제된 SUM·IF formula 두 개를 넣습니다.", "data_only=False/True를 각각 열어 수식·cache 결과를 기록합니다.", "Excel 재계산 전 None을 0으로 바꾸지 않습니다.", "read_only view를 명시적으로 닫습니다."],
      hints: ["openpyxl은 수식을 계산하지 않습니다.", "같은 파일을 두 모드로 따로 load하세요."],
      expectedOutcome: "값·표시·수식·cache가 별도 층이라는 재현 가능한 보고서가 완성됩니다.",
      solutionOutline: ["Python 타입으로 값을 씁니다.", "style과 number_format을 적용합니다.", "수식을 저장합니다.", "두 load 모드의 Cell.value를 비교합니다."],
    },
    {
      difficulty: "설계",
      prompt: "대규모 사용자 제출을 xlsx로 내보내는 운영 파이프라인을 설계하세요.",
      requirements: ["100만 행에 가까운 입력에서 write_only 선택과 Excel 행 한도를 검토합니다.", "불신 text와 승인 formula 열 schema, formula injection·제어문자 정책을 정의합니다.", "날짜 timezone, 빈 값, style 수 제한, duplicate sheet/title 정책을 포함합니다.", "임시 저장·read-back·원자 교체·잠금·동시 writer·backup 복구를 설계합니다.", "read_only 소비자 검증, data_only cache freshness, macro·외부 link 보존 여부를 문서화합니다.", "최소 15개 정상·경계·실패·보안 테스트를 작성합니다."],
      hints: ["write_only는 기본 시트가 없고 append·single save만 가능합니다.", "원자 교체는 lost update와 전원 장애 durability를 모두 해결하지 않습니다.", "CSV와 직접 xlsx의 formula 해석 차이를 최종 consumer에서 테스트하세요."],
      expectedOutcome: "메모리, 정확성, 보안, 파일 수명과 Excel consumer 검증을 분리한 구현 준비 설계가 나옵니다.",
      solutionOutline: ["입력 schema와 output workbook schema를 고정합니다.", "stream validation·WriteOnlyCell style·formula allowlist를 설계합니다.", "temp 저장과 별도 검증 process를 둡니다.", "versioned 교체와 audit manifest를 정의합니다.", "실제 Excel/LibreOffice 회귀 matrix를 추가합니다."],
    },
  ],
  reviewQuestions: [
    { question: "Workbook, Worksheet, Cell은 어떤 관계인가요?", answer: "Workbook이 xlsx 문서 최상위이고 그 안에 여러 Worksheet가 있으며 각 Worksheet가 좌표별 Cell을 가집니다." },
    { question: "Workbook()과 Workbook(write_only=True)의 새 시트 차이는 무엇인가요?", answer: "일반 Workbook에는 기본 시트 하나가 있지만 write_only Workbook에는 기본 시트가 없어 create_sheet를 호출해야 합니다." },
    { question: "ws['A1']과 ws.cell(row=1,column=1)은 같은 셀인가요?", answer: "같은 Worksheet의 같은 좌표를 가리킵니다. Excel 행·열 번호는 1부터 시작합니다." },
    { question: "빈 셀을 if not cell.value로 제외하면 어떤 문제가 있나요?", answer: "정상 값 0, False, 빈 문자열까지 함께 제외됩니다. 정말 빈 셀만 제외하려면 is None을 사용합니다." },
    { question: "data_only=True는 수식을 새로 계산하나요?", answer: "아닙니다. 파일에 마지막으로 저장된 계산 cache를 읽습니다. cache가 없거나 오래되면 None 또는 오래된 값일 수 있습니다." },
    { question: "왜 formula workbook을 data_only=False와 True로 따로 열어야 하나요?", answer: "한 load view는 셀마다 수식 또는 cache 중 하나를 선택하므로 두 표현을 비교하려면 두 Workbook이 필요합니다." },
    { question: "read_only mode를 언제 쓰고 무엇을 주의하나요?", answer: "큰 파일을 행 순서로 한 번 읽을 때 사용합니다. 수정할 수 없고 dimension metadata를 확인하며 명시적으로 close해야 합니다." },
    { question: "write_only mode를 두 번 save할 수 있나요?", answer: "아닙니다. append 중심 one-shot stream이며 한 번 저장한 뒤 재저장·추가할 수 없습니다." },
    { question: "=로 시작하는 사용자 입력을 그대로 Cell.value에 넣으면 왜 위험한가요?", answer: "openpyxl이 formula로 저장할 수 있고 spreadsheet consumer가 계산할 수 있습니다. 승인 formula와 불신 text를 분리해야 합니다." },
    { question: "임시 파일 뒤 os.replace를 쓰면 모든 저장 문제가 해결되나요?", answer: "아닙니다. 부분 파일 노출은 줄이지만 파일 잠금, 동시 writer lost update, fsync durability, backup·복구는 별도 설계가 필요합니다." },
  ],
  completionChecklist: [
    "Workbook→Worksheet→Cell 계층과 openpyxl이 Excel 계산 엔진이 아님을 설명할 수 있다.",
    "시트 생성 위치·이름 변경 뒤 sheetnames 순서를 예측할 수 있다.",
    "주소·row/column·append로 값을 쓰고 저장 후 재조회할 수 있다.",
    "A1:E4 범위를 행·열 순으로 읽고 None 보존 정책을 선택할 수 있다.",
    "date·number_format·Font의 값과 표시 역할을 구분할 수 있다.",
    "formula text와 data_only cache, None·stale 가능성을 설명할 수 있다.",
    "일반·read_only·write_only 모드의 기능·메모리·close·save 제한을 비교할 수 있다.",
    "불신 text를 formula로 저장하지 않는 schema와 검증을 적용할 수 있다.",
    "same-directory temp 저장·검증·os.replace·finally close를 구현할 수 있다.",
    "세 실행 예제를 직접 실행해 제시된 출력과 생성 xlsx를 확인했다.",
  ],
  nextSessions: [],
  sources: [
    {
      id: "py-day05-ex06",
      repository: "PYTHON-BASIC",
      path: "day05/ex06_excel.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex06_excel.py",
      usedFor: ["Workbook 생성", "기본·추가·삽입 시트", "시트 제목", "주소·cell·append 입력", "save·close"],
      evidence: "Python 3.13.9·openpyxl 3.1.5에서 격리된 임시 폴더로 직접 실행해 xlsx 생성과 '수고하셨습니다.' 출력을 확인했습니다.",
    },
    {
      id: "py-day05-ex07",
      repository: "PYTHON-BASIC",
      path: "day05/ex07_excel.py",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex07_excel.py",
      usedFor: ["load_workbook", "data_only", "sheetnames", "A1·A2", "A1:E4 범위", "None 제외", "평탄화 결과"],
      evidence: "격리 생성 파일을 직접 읽어 시트 세 개, A1 Hello World, A2 None, 4×5 범위와 t_list=['Hello World','방가방가','하이~~','데이터 입력 연습']을 확인했습니다.",
    },
    {
      id: "py-day05-note",
      repository: "PYTHON-BASIC",
      path: "notes/day05_lambda_file_excel.md",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day05_lambda_file_excel.md",
      usedFor: ["Workbook·Worksheet·Cell 용어", "설치", "시트·셀 쓰기", "저장·종료", "data_only cache 주의", "범위 읽기"],
      evidence: "Day05 노트를 전부 읽고 Excel 절과 앞선 경로·파일 close 원칙을 감사했으며 CSV·JSON 상세는 별도 세션 범위로 남겼습니다.",
    },
    {
      id: "py-day05-xlsx",
      repository: "PYTHON-BASIC",
      path: "data/excel_sample01.xlsx",
      publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/data/excel_sample01.xlsx",
      usedFor: ["실제 xlsx artifact", "시트 순서", "셀 좌표·타입", "범위 dimension", "data_only 비교"],
      evidence: "기존 artifact와 임시 재생성 artifact를 formula/data_only 두 모드로 열어 세 시트, 첫 시트 4개 문자열, 두 번째 A1:I1 숫자, 세 번째 대각선 5개 문자열을 확인했습니다.",
    },
    {
      id: "openpyxl-tutorial",
      repository: "openpyxl Documentation",
      path: "en/3.1/tutorial.html",
      publicUrl: "https://openpyxl.readthedocs.io/en/3.1/tutorial.html",
      usedFor: ["Workbook 생성·로딩", "data_only 의미", "read_only 선택", "기존 workbook 기능 보존 한계"],
      evidence: "data_only가 마지막 저장 계산값을 선택하며 read_only가 기능을 제한하는 공식 설명을 원본 보강 범위로 사용했습니다.",
    },
    {
      id: "openpyxl-usage",
      repository: "openpyxl Documentation",
      path: "en/stable/usage.html",
      publicUrl: "https://openpyxl.readthedocs.io/en/stable/usage.html",
      usedFor: ["append", "셀 style", "Workbook 기본 사용"],
      evidence: "행 데이터 append와 cell style의 공식 사용 예를 학습 예제 검토에 사용했습니다.",
    },
    {
      id: "openpyxl-styles",
      repository: "openpyxl Documentation",
      path: "en/3.1.0/styles.html",
      publicUrl: "https://openpyxl.readthedocs.io/en/3.1.0/styles.html",
      usedFor: ["Font·Fill·Alignment", "날짜·숫자 number_format", "셀별 스타일 적용"],
      evidence: "스타일은 셀에 직접 적용하고 날짜·숫자의 값과 표시 형식을 구분하는 공식 범위를 보강했습니다.",
    },
    {
      id: "openpyxl-optimized",
      repository: "openpyxl Documentation",
      path: "en/stable/optimized.html",
      publicUrl: "https://openpyxl.readthedocs.io/en/stable/optimized.html",
      usedFor: ["read_only lazy mode", "명시 close", "dimension reset", "write_only create_sheet·append·single save", "WriteOnlyCell"],
      evidence: "최적화 모드의 near-constant memory 목표와 각 기능 제한을 공식 문서 범위로 사용했습니다.",
    },
    {
      id: "owasp-formula-injection",
      repository: "OWASP Foundation",
      path: "www-community/attacks/CSV_Injection",
      publicUrl: "https://owasp.org/www-community/attacks/CSV_Injection",
      usedFor: ["spreadsheet formula injection 위협", "위험 시작 문자", "consumer·재저장별 완전한 범용 방어 부재"],
      evidence: "CSV와 직접 xlsx 셀 타입을 같다고 단정하지 않고, spreadsheet export의 불신 입력 threat model과 consumer별 방어 trade-off를 보강했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 4,
    filesUsed: 4,
    uncoveredNotes: [
      "원본 두 Python 파일과 Day05 노트뿐 아니라 실제 data/excel_sample01.xlsx를 openpyxl 3.1.5로 재조회해 시트·좌표·타입을 확인했습니다.",
      "원본에는 formula 작성, style·date, read_only/write_only, formula injection, 원자 교체가 없어 openpyxl·OWASP 공식 공개 문서와 직접 생성한 합성 workbook 실험으로 보강했습니다.",
      "차트·이미지·merged cell·data validation·pivot·macro·외부 link의 전체 보존과 GUI 렌더링은 이 원자 세션 범위를 벗어나 후속 Excel 자동화 과정으로 남겼습니다.",
    ],
  },
} satisfies DetailedSession;

export default session;

const advancedWorkbookExamples: DetailedSession["chapters"][number]["codeExamples"] = [
  {
    id: "python-openpyxl-merged-anchor-style-roundtrip",
    title: "merged range의 anchor cell과 style을 메모리 XLSX로 round-trip합니다",
    language: "python",
    filename: "xlsx_merged_style.py",
    purpose: "병합 영역은 왼쪽 위 cell만 값을 보유하고 나머지는 MergedCell placeholder라는 점과 style·number format 보존을 검증합니다.",
    code: "from io import BytesIO\n\nfrom openpyxl import Workbook, load_workbook\nfrom openpyxl.styles import Alignment, Font\n\nbook = Workbook()\nsheet = book.active\nsheet.title = 'Report'\nsheet.merge_cells('A1:C1')\nsheet['A1'] = 'Summary'\nsheet['A1'].font = Font(bold=True)\nsheet['A1'].alignment = Alignment(horizontal='center')\nsheet['B2'] = 7\nsheet['B2'].number_format = '0.00'\n\nstream = BytesIO()\nbook.save(stream)\nbook.close()\nstream.seek(0)\n\nloaded = load_workbook(stream)\nreport = loaded['Report']\nmerged = sorted(str(item) for item in report.merged_cells.ranges)\nprint(f'merged={merged}|anchor={report[\"A1\"].value}|placeholder={type(report[\"B1\"]).__name__}')\nprint(f'style=bold:{report[\"A1\"].font.bold}|align:{report[\"A1\"].alignment.horizontal}|format:{report[\"B2\"].number_format}')\nloaded.close()",
    walkthrough: [
      { lines: "1-4", explanation: "disk 경로 없이 XLSX package를 검증할 BytesIO와 openpyxl·style 타입을 준비합니다." },
      { lines: "6-14", explanation: "A1:C1을 병합하고 anchor A1에 값·style, 일반 B2에 숫자 format을 설정합니다." },
      { lines: "16-19", explanation: "workbook을 ZIP 기반 XLSX bytes로 저장하고 읽기 위치를 되감습니다." },
      { lines: "21-26", explanation: "재로드 뒤 병합 범위·placeholder 타입·style·number format을 exact 확인하고 resource를 닫습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "openpyxl 3.1 계열"], command: "python xlsx_merged_style.py" },
    output: { value: "merged=['A1:C1']|anchor=Summary|placeholder=MergedCell\nstyle=bold:True|align:center|format:0.00", explanation: ["병합 범위의 값은 anchor A1에 있습니다.", "B1은 일반 Cell이 아니라 MergedCell placeholder입니다.", "style과 number format이 save/load 뒤 유지됩니다."] },
    experiments: [
      { change: "B1에 직접 값을 대입합니다.", prediction: "병합 placeholder는 read-only라 AttributeError가 납니다.", result: "항상 왼쪽 위 anchor를 수정합니다." },
      { change: "unmerge_cells 뒤 B1을 검사합니다.", prediction: "일반 Cell로 돌아오지만 이전 placeholder에 별도 값은 없습니다.", result: "병합은 여러 값을 합치는 연산이 아닙니다." },
      { change: "A1의 font object를 다른 cell에 직접 수정하려 합니다.", prediction: "style은 immutable/shared semantics라 copy 또는 새 style assignment가 필요합니다.", result: "style explosion과 alias 오해를 피합니다." },
    ],
    sourceRefs: ["openpyxl-merged-cells-026", "openpyxl-styles", "openpyxl-usage"],
  },
  {
    id: "python-openpyxl-write-only-read-only-pipeline",
    title: "write-only append 결과를 read-only values stream으로 다시 읽습니다",
    language: "python",
    filename: "xlsx_optimized_pipeline.py",
    purpose: "대용량 모드에서 random cell access 대신 append와 lazy iter_rows를 사용하고 workbook close 책임을 검증합니다.",
    code: "from io import BytesIO\n\nfrom openpyxl import Workbook, load_workbook\n\nstream = BytesIO()\nwriter_book = Workbook(write_only=True)\nwriter_sheet = writer_book.create_sheet('Rows')\nwriter_sheet.append(['name', 'score'])\nwriter_sheet.append(['Kim', 90])\nwriter_sheet.append(['Lee', 85])\nwriter_book.save(stream)\nstream.seek(0)\n\nreader_book = load_workbook(stream, read_only=True, data_only=False)\nreader_sheet = reader_book['Rows']\nrows = list(reader_sheet.iter_rows(values_only=True))\nprint(f'read_only={reader_book.read_only}|sheets={reader_book.sheetnames}')\nprint(f'rows={rows}')\nreader_book.close()",
    walkthrough: [
      { lines: "1-3", explanation: "메모리 binary stream과 workbook API를 준비합니다." },
      { lines: "5-11", explanation: "write-only workbook에는 sheet를 명시적으로 만들고 row 순서대로 append한 뒤 한 번 저장합니다." },
      { lines: "12-16", explanation: "stream을 되감아 read-only workbook으로 열고 values_only iterator로 cell object 대신 값 tuple을 읽습니다." },
      { lines: "17-19", explanation: "mode·sheet·rows를 출력한 뒤 lazy reader resource를 명시적으로 닫습니다." },
    ],
    run: { environment: ["Python 3.11 이상", "openpyxl 3.1 계열"], command: "python xlsx_optimized_pipeline.py" },
    output: { value: "read_only=True|sheets=['Rows']\nrows=[('name', 'score'), ('Kim', 90), ('Lee', 85)]", explanation: ["write-only workbook에는 기본 sheet가 없어 create_sheet가 필요합니다.", "read-only iter_rows는 필요한 row를 lazy하게 읽습니다.", "values_only=True는 값 tuple을 반환합니다."] },
    experiments: [
      { change: "write-only sheet에서 `sheet['A1']` random access를 시도합니다.", prediction: "일반 worksheet처럼 사용할 수 없어 실패합니다.", result: "optimized mode API 제약을 별도 adapter에 둡니다." },
      { change: "저장한 write-only workbook을 다시 save합니다.", prediction: "한 번만 저장 가능한 stream 특성 때문에 예외가 납니다.", result: "temp path와 atomic replace lifecycle을 한 번으로 설계합니다." },
      { change: "read_only=False로 열어 rows를 비교합니다.", prediction: "값은 같지만 전체 cell graph를 메모리에 구성합니다.", result: "파일 크기와 편집 요구에 따라 mode를 선택합니다." },
    ],
    sourceRefs: ["openpyxl-optimized", "openpyxl-usage", "openpyxl-merged-cells-026"],
  },
];

(session.chapters.find((chapter) => chapter.id === "independent-checkpoint")!.codeExamples as DetailedSession["chapters"][number]["codeExamples"]).push(...advancedWorkbookExamples);

(session.sources as DetailedSession["sources"]).push(
  { id: "openpyxl-merged-cells-026", repository: "openpyxl Documentation", path: "Worksheet merge_cells and merged_cells ranges", publicUrl: "https://openpyxl.readthedocs.io/en/stable/api/openpyxl.worksheet.worksheet.html#openpyxl.worksheet.worksheet.Worksheet.merge_cells", usedFor: ["merge_cells", "merged_cells.ranges", "anchor cell", "worksheet range lifecycle"], evidence: "병합 범위 API와 worksheet의 cell/range 동작을 openpyxl 공식 API 문서로 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "병합된 A1:C1에서 실제 값을 저장하는 cell은 어디인가요?", answer: "왼쪽 위 anchor인 A1이며 나머지는 MergedCell placeholder입니다." },
  { question: "`data_only=True`가 formula를 Python에서 계산하나요?", answer: "아닙니다. 마지막으로 spreadsheet가 저장한 cached value를 읽을 뿐 openpyxl은 수식을 계산하지 않습니다." },
  { question: "write-only workbook에도 기본 active sheet가 있나요?", answer: "없습니다. create_sheet로 명시적으로 만든 뒤 row를 append해야 합니다." },
  { question: "read-only workbook은 왜 close를 명시해야 하나요?", answer: "lazy XML/ZIP stream과 파일 handle을 유지할 수 있어 처리가 끝나면 close해야 합니다." },
  { question: "XLSX style을 지정하면 cell의 숫자 값도 문자열로 바뀌나요?", answer: "아닙니다. number_format은 표시 metadata이고 cell value의 Python 타입과 분리됩니다." },
);

(session.completionChecklist as string[]).push(
  "merged range의 anchor와 MergedCell placeholder를 구분한다.",
  "style·alignment·number format을 save/load round-trip으로 검사했다.",
  "formula text와 cached value, 실제 계산 책임을 구분한다.",
  "write-only sheet를 생성하고 append-only 제약을 지킨다.",
  "read-only values stream을 소비한 뒤 workbook을 close한다.",
);
