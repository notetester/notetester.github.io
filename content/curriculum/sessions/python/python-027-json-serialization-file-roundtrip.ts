import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-027"],
  slug: "python-027-json-serialization-file-roundtrip",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 27,
  title: "JSON 직렬화와 파일 왕복",
  subtitle: "Python 객체와 JSON 문서의 서로 다른 타입 체계를 이해하고, UTF-8·정밀도·schema·신뢰 경계를 지키는 안전한 직렬화 파이프라인을 만듭니다.",
  level: "중급",
  estimatedMinutes: 135,
  coreQuestion: "메모리의 Python 객체를 다른 언어·프로세스·파일과 교환하면서 타입 의미와 한글, 정밀도, 버전, 보안을 잃지 않으려면 JSON 경계를 어떻게 설계해야 할까요?",
  summary: "dumps·loads와 dump·load의 문자열/파일 차이, dict·list·str·number·bool·null 타입 mapping, ensure_ascii·indent·sort_keys를 실행으로 확인합니다. tuple·정수 key·datetime·Decimal처럼 손실되거나 지원되지 않는 값을 명시적 schema로 변환하고, NaN·중복 key·큰 숫자·부동소수점 정밀도 경계를 다룹니다. parsing과 검증을 분리해 신뢰할 수 없는 문서를 제한하고, version migration·JSON Lines streaming·원자적 파일 교체·민감정보 정책까지 확장합니다.",
  objectives: [
    "serialization과 parsing을 설명하고 dumps/loads와 dump/load의 입력·출력 차이를 구분할 수 있다.",
    "Python 기본 타입이 JSON object·array·string·number·boolean·null로 어떻게 변환되고 왕복 시 무엇이 달라지는지 예측할 수 있다.",
    "ensure_ascii=False와 UTF-8 파일 encoding의 서로 다른 역할을 설명할 수 있다.",
    "datetime·Decimal·set·사용자 객체를 무작정 문자열화하지 않고 명시적 JSON schema로 변환할 수 있다.",
    "json.loads 성공과 도메인 schema 검증 성공을 분리하고 누락·추가·잘못된 타입·범위를 진단할 수 있다.",
    "NaN·Infinity·중복 key·큰 정수·float 정밀도에 대한 상호운용 정책을 정할 수 있다.",
    "크기·중첩·record 수를 제한하고 원자적 쓰기와 version migration으로 안전한 파일 왕복을 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "딕셔너리 조회·순회·수정", reason: "JSON object가 loads 뒤 dict가 되고 key·value schema를 검증합니다.", sessionSlug: "python-013-dictionary-access-iteration-update" },
    { title: "경로·파일 모드·context manager", reason: "UTF-8 파일, with 자원 수명, 임시 파일 후 교체를 JSON 저장에 적용합니다.", sessionSlug: "python-024-path-file-modes-context-manager" },
    { title: "숫자형·진법·형 변환", reason: "JSON number와 Python int·float·Decimal의 정밀도·범위 차이를 다룹니다.", sessionSlug: "python-004-numeric-types-conversion" },
  ],
  keywords: ["Python", "JSON", "serialization", "deserialization", "dumps", "loads", "dump", "load", "UTF-8", "schema validation", "Decimal", "JSON Lines"],
  chapters: [
    {
      id: "json-boundary-model",
      title: "JSON은 Python 코드가 아니라 제한된 공통 데이터 문법입니다",
      lead: "JSON 문서는 문자열 text이고 loads가 새 Python 객체 graph를 만들며 원래 객체 identity나 class 행동은 전송하지 않습니다.",
      explanations: [
        "serialization은 메모리 객체를 저장·전송 가능한 표현으로 바꾸는 과정이고 deserialization은 그 표현을 다시 언어 객체로 해석하는 과정입니다. JSON은 object, array, string, number, true, false, null이라는 작은 공통 타입 체계를 사용합니다. 함수·class method·파일 handle 같은 실행 행동은 JSON에 담기지 않습니다.",
        "원본 student dict는 name 문자열, scores list, passed bool로 구성되어 JSON object로 자연스럽게 변환됩니다. json.dumps는 str을 반환하고 json.loads는 JSON str·bytes를 읽어 새 dict/list/value를 만듭니다. restored == student일 수 있어도 restored is student는 False입니다.",
        "JSON object key 문법은 문자열만 허용합니다. Python dict의 정수 key 1은 dumps 과정에서 '1' 문자열 key가 되어 loads 후 원래 타입으로 돌아오지 않습니다. tuple은 JSON array가 되어 loads 후 list입니다. 단순 round-trip이 항상 Python 타입·구조를 완벽히 보존한다고 가정하면 안 됩니다.",
        "JSON은 댓글·trailing comma·single quote를 표준 문법으로 허용하지 않습니다. Python repr인 {'name': '둘리'}는 JSON이 아닙니다. eval로 억지로 읽지 말고 생산자 format을 수정하거나 별도 parser와 migration을 사용합니다.",
      ],
      concepts: [
        { term: "serialization", definition: "언어의 메모리 객체를 파일·네트워크로 전달할 수 있는 data 표현으로 변환하는 과정입니다.", detail: ["객체 identity와 행동은 보통 보존되지 않습니다.", "format schema와 version이 호출자 사이 계약이 됩니다."] },
        { term: "JSON document", definition: "RFC·ECMA 문법을 따르는 하나의 JSON value text이며 Python dict repr와는 다른 언어 중립 표현입니다.", detail: ["최상위는 object뿐 아니라 array·string·number 등도 가능합니다.", "object key는 문자열입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "JSONDecodeError: Expecting property name enclosed in double quotes가 발생한다.", likelyCause: "single quote를 쓴 Python dict repr, trailing comma 또는 댓글을 JSON으로 읽었습니다.", checks: ["오류 line·column 주변을 확인하되 민감 원문 전체를 로그에 남기지 않습니다.", "Content-Type과 생산자 format을 확인합니다.", "표준 JSON validator로 최소 문서를 검사합니다."], fix: "생산자가 json.dumps 같은 표준 serializer를 사용하게 하고 기존 비표준 data는 신뢰 가능한 별도 migration parser로 변환합니다.", prevention: "문자열 이어 붙이기로 JSON을 만들지 않고 serializer와 contract test를 사용합니다." },
      ],
    },
    {
      id: "dumps-loads-type-mapping",
      title: "dumps와 loads 사이에서 보존되는 값과 바뀌는 타입을 표로 확인합니다",
      lead: "JSON에는 tuple·set·bytes·datetime·Decimal 구분이 없으므로 serializer가 지원하거나 우리가 명시적으로 표현한 정보만 왕복합니다.",
      explanations: [
        "Python dict는 JSON object, list와 tuple은 array, str은 string, int·float는 number, True·False는 true·false, None은 null로 변환됩니다. loads는 object를 dict, array를 list, string을 str, 정수 모양 number를 int, 소수·지수 number를 float, boolean을 bool, null을 None으로 만듭니다.",
        "tuple이 list로 돌아오는 것은 오류가 아니라 JSON 타입 체계의 결과입니다. tuple 의미가 중요하다면 {'type':'point','coordinates':[10,20]}처럼 domain type tag와 field 이름을 schema에 포함하고 검증 뒤 tuple로 재구성합니다. 임의 class 이름을 자동 import·실행하는 범용 deserializer는 보안상 피합니다.",
        "dict key가 문자열이 아닌 경우 기본 serializer는 일부 기본 key를 문자열로 바꾸거나 TypeError를 냅니다. skipkeys=True로 잘못된 key를 조용히 버리면 data 손실을 감춥니다. 외부 계약에는 처음부터 문자열 field 이름만 사용하고 내부 mapping은 명시 변환합니다.",
        "JSON object의 field 순서는 의미를 가져서는 안 됩니다. Python dict가 삽입 순서를 보존하고 dumps가 현재 순서로 출력해도 소비자가 재정렬할 수 있습니다. 순서가 domain data라면 array로 표현합니다.",
      ],
      concepts: [
        { term: "type mapping", definition: "서로 다른 두 타입 체계에서 어떤 source 값을 어떤 target 값으로 표현할지 정한 대응 관계입니다.", detail: ["완전한 일대일이 아니면 왕복 손실이 생깁니다.", "domain type tag와 schema로 의미를 보강할 수 있습니다."] },
        { term: "round-trip", definition: "객체를 직렬화한 뒤 역직렬화해 기대한 의미가 보존되는지 확인하는 왕복 과정입니다.", detail: ["동등성과 동일성은 다릅니다.", "tuple/list·key type·number precision처럼 구조가 달라질 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "json-string-roundtrip",
          title: "한글과 tuple·정수 key의 왕복 차이 확인",
          language: "python",
          filename: "json_roundtrip.py",
          purpose: "dumps 결과와 loads 뒤 실제 타입을 출력해 JSON type mapping을 관찰합니다.",
          code: "import json\n\ndata = {\n    'name': '둘리',\n    'scores': (90, 80, 95),\n    'passed': True,\n    'memo': None,\n    'labels': {1: '입문', 2: '중급'},\n}\n\ntext = json.dumps(data, ensure_ascii=False, sort_keys=True)\nrestored = json.loads(text)\n\nprint(text)\nprint(type(restored).__name__)\nprint(type(restored['scores']).__name__, restored['scores'])\nprint(restored['labels'])\nprint(f'equal={restored == data}, same={restored is data}')",
          walkthrough: [
            { lines: "1-9", explanation: "JSON 기본 타입과 tuple·정수 key처럼 왕복 차이가 있는 값을 한 dict에 준비합니다." },
            { lines: "11-12", explanation: "ensure_ascii=False로 한글을 사람이 읽는 문자로 출력하고 sort_keys=True로 object key 표시 순서를 안정화한 뒤 새 객체를 parse합니다." },
            { lines: "14-18", explanation: "JSON text, 최상위 dict, scores list, labels의 문자열 key, equality와 identity를 차례로 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "json_roundtrip.py로 저장"], command: "python json_roundtrip.py" },
          output: { value: "{\"labels\": {\"1\": \"입문\", \"2\": \"중급\"}, \"memo\": null, \"name\": \"둘리\", \"passed\": true, \"scores\": [90, 80, 95]}\ndict\nlist [90, 80, 95]\n{'1': '입문', '2': '중급'}\nequal=False, same=False", explanation: ["ensure_ascii=False여도 JSON string quote·true·null 같은 JSON 문법은 유지됩니다.", "tuple scores는 list, 정수 label key는 문자열이 되어 원본 dict와 값 동등성도 False입니다.", "loads는 언제나 새 object graph를 만들므로 identity는 보존되지 않습니다."] },
          experiments: [
            { change: "ensure_ascii=False를 제거합니다.", prediction: "한글이 \\uXXXX escape로 표시되지만 loads한 최종 str 값은 같은 한글입니다.", result: "ensure_ascii는 JSON 의미보다 text 표시·전송 호환성을 바꾸는 옵션입니다." },
            { change: "sort_keys=True를 제거합니다.", prediction: "현재 Python에서는 입력 dict 삽입 순서로 표시되지만 소비자가 field 순서를 의미 있게 해석해서는 안 됩니다.", result: "canonical 서명·diff 목적이면 별도 canonicalization 계약이 필요합니다." },
          ],
          sourceRefs: ["py-json-source", "python-json-doc"],
        },
      ],
      diagnostics: [
        { symptom: "왕복 뒤 tuple이 list가 되거나 dict key type이 바뀌었다.", likelyCause: "JSON에 tuple 또는 비문자 object key 구분이 없는데 Python 타입이 그대로 보존될 것으로 가정했습니다.", checks: ["직렬화 전후 type과 repr을 field별로 비교합니다.", "domain에서 순서·불변·key type이 실제 의미인지 확인합니다.", "schema에 type tag나 이름 있는 field가 필요한지 봅니다."], fix: "JSON 공통 타입으로 명시 schema를 설계하고 parse·검증 후 domain 타입으로 재구성합니다.", prevention: "대표값뿐 아니라 tuple·key·null·빈 구조를 포함한 round-trip contract test를 둡니다." },
      ],
    },
    {
      id: "dump-load-files-encoding",
      title: "dump와 load는 이미 열린 text file 객체를 사용하며 encoding은 open 경계가 결정합니다",
      lead: "json.dump는 경로를 받는 함수가 아니라 write 가능한 file-like 객체에 text를 쓰고 json.load는 read 가능한 객체에서 text를 읽습니다.",
      explanations: [
        "원본은 TemporaryDirectory 안 student.json을 with path.open('w', encoding='utf-8')로 열고 json.dump를 호출합니다. 다시 r·UTF-8로 열어 json.load합니다. 파일 자원 수명·경로·encoding은 open이, JSON 문법 직렬화는 json module이 담당합니다.",
        "ensure_ascii=False는 비ASCII 문자를 \\u escape 대신 실제 Unicode 문자로 출력하게 합니다. 이것만으로 disk encoding이 자동 UTF-8이 되는 것은 아닙니다. text file의 encoding='utf-8'을 함께 지정해야 한글 bytes가 환경과 무관하게 일정합니다.",
        "indent=2는 사람이 읽고 diff하기 좋은 여러 줄 형식을 만들지만 파일 크기가 커집니다. compact 전송에는 separators=(',', ':')를 사용할 수 있습니다. 표시 형식은 소비자가 whitespace를 무시하는 표준 parser를 사용한다면 의미를 바꾸지 않습니다.",
        "with는 close를 보장하지만 대상 파일을 w로 직접 열면 serialization 중 TypeError·disk full이 발생할 때 기존 파일이 이미 지워지고 부분 JSON이 남을 수 있습니다. 중요 파일은 임시 파일에 전체 JSON을 쓰고 다시 parse·schema 검증한 뒤 os.replace로 교체합니다.",
      ],
      concepts: [
        { term: "dump/load", definition: "Python 객체를 열린 text file-like 객체에 JSON으로 쓰거나 열린 객체의 JSON text를 Python 값으로 읽는 함수 쌍입니다.", detail: ["dumps/loads의 s는 string을 떠올리면 구분하기 쉽습니다.", "경로·encoding·자원 수명은 file open 계층의 책임입니다."] },
        { term: "ensure_ascii", definition: "False일 때 비ASCII 문자를 실제 Unicode로 출력하고 True일 때 ASCII escape로 표현하는 encoder option입니다.", detail: ["loads 결과의 문자 의미는 같습니다.", "파일 encoding 지정과 별개입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "json.dump에 경로 문자열을 두 번째 인수로 주었더니 write 관련 오류가 난다.", likelyCause: "dump가 경로가 아니라 write method를 가진 file-like 객체를 요구합니다.", checks: ["두 번째 인수 type과 hasattr(value,'write')를 확인합니다.", "dumps와 dump를 혼동했는지 봅니다.", "with open의 mode·encoding을 확인합니다."], fix: "문자열이 필요하면 dumps를 사용하고 파일 저장이면 with path.open(...,encoding='utf-8') as file 뒤 dump(data,file)를 호출합니다.", prevention: "API 이름·입력·출력 표를 두고 string과 file round-trip을 별도 테스트합니다." },
      ],
    },
    {
      id: "custom-domain-values",
      title: "JSON에 없는 domain 타입은 의미가 보이는 field와 변환 규칙으로 표현합니다",
      lead: "default=str로 무엇이든 문자열화하면 실행은 되지만 타입·시간대·정밀도·복원 규칙을 잃을 수 있습니다.",
      explanations: [
        "datetime은 JSON 기본 타입이 아닙니다. ISO 8601 문자열로 표현할 수 있지만 timezone 포함 여부, UTC 정규화, 소수 초, Z 표기를 schema에 정해야 합니다. 단순 str(datetime) 결과를 parse할 소비자가 같은 규칙을 안다고 가정하지 않습니다.",
        "Decimal은 금액 정밀도를 보존하기 위해 문자열 '1234.50'로 전송하거나 정수 minor unit 123450과 currency field를 함께 보낼 수 있습니다. float로 바꾸면 소수 이진 표현과 다른 언어 number 범위 때문에 값이 달라질 수 있습니다. 표현 선택은 domain 계약입니다.",
        "set은 순서 없는 unique collection이지만 JSON array로 바꾸면 loads 뒤 uniqueness가 자동 보장되지 않습니다. sorted list로 안정적 text를 만들고 검증 뒤 set으로 재구성할 수 있습니다. bytes는 base64 문자열과 encoding tag를 사용하되 크기 증가와 decode 검증을 고려합니다.",
        "custom encoder default 함수는 아는 타입만 명시적으로 변환하고 unknown은 TypeError를 다시 발생시켜야 합니다. 모든 unknown을 str로 삼키면 새 타입 추가가 조용한 data 손실이 됩니다. decoder도 임의 class import보다 type tag whitelist와 constructor validation을 사용합니다.",
      ],
      concepts: [
        { term: "domain representation", definition: "JSON 기본 타입만으로 domain 값의 의미·단위·버전을 명시한 field 구조입니다.", detail: ["금액은 amount와 currency, 시간은 timezone 포함 timestamp처럼 표현합니다.", "소비자가 검증·재구성할 규칙을 schema에 포함합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: Object of type ... is not JSON serializable이 발생한다.", likelyCause: "datetime·Decimal·set·bytes·사용자 객체처럼 JSON 기본 encoder가 mapping을 모르는 값을 포함했습니다.", checks: ["오류 field의 실제 type과 domain 의미를 확인합니다.", "무작정 __dict__ 전체를 노출하려는지 점검합니다.", "소비자가 복원에 필요한 단위·timezone·version을 정합니다."], fix: "허용 타입마다 명시적 JSON 표현을 만들고 unknown 타입은 TypeError로 거부합니다.", prevention: "domain schema와 custom encode/decode round-trip test, 민감 field allowlist를 유지합니다." },
      ],
    },
    {
      id: "parse-then-validate",
      title: "JSON 문법 parsing 성공은 필수 field·타입·범위가 올바르다는 뜻이 아닙니다",
      lead: "loads는 text를 일반 Python 값으로 바꿀 뿐 애플리케이션이 기대한 student·order·config 구조까지 검증하지 않습니다.",
      explanations: [
        "json.loads('123')도 정상이며 int 123을 반환합니다. 애플리케이션이 object를 기대한다면 먼저 isinstance(value, dict)를 확인합니다. 그다음 required key, 추가 key 정책, 각 value 타입과 범위, field 간 관계를 검증합니다.",
        "bool은 Python에서 int의 하위 타입이므로 isinstance(True, int)가 True입니다. scores에서 bool을 숫자로 허용하지 않으려면 type(score) is int처럼 정확한 domain 검사를 사용합니다. 빈 문자열·공백·NaN·너무 큰 목록도 별도 경계입니다.",
        "검증 실패를 KeyError·TypeError가 우연히 발생할 때까지 기다리지 말고 path와 오류 code를 수집합니다. 다만 민감한 password·token·개인정보 value 전체를 오류 메시지와 로그에 포함하지 않습니다. field 이름과 기대 타입, record ID 정도로 최소화합니다.",
        "TypedDict와 type hint는 개발 도구용 계약이지 json.loads 결과를 자동 검증하지 않습니다. dataclass도 dict를 자동 안전 변환하지 않습니다. 작은 프로젝트는 명시 검증 함수, 복잡한 API는 JSON Schema·검증 library를 사용할 수 있지만 외부 library 버전과 coercion 정책을 고정합니다.",
      ],
      concepts: [
        { term: "schema validation", definition: "parsed data가 기대한 container·필수 field·추가 field·값 타입·범위·관계 규칙을 만족하는지 검사하는 별도 단계입니다.", detail: ["JSON 문법 검사보다 domain에 가깝습니다.", "검증된 data만 내부 model로 변환합니다."] },
        { term: "trust boundary", definition: "외부·파일·네트워크 data가 내부에서 신뢰 가능한 값으로 바뀌는 경계입니다.", detail: ["parse·size limit·schema·권한 검증이 모입니다.", "출처가 내부 파일이어도 사용자나 이전 버전이 수정할 수 있으면 검증합니다."] },
      ],
      codeExamples: [
        {
          id: "json-parse-and-validate",
          title: "문법 오류와 schema 오류를 분리하는 student validator",
          language: "python",
          filename: "json_validation.py",
          purpose: "여러 payload를 loads한 뒤 container·field·점수 타입과 범위를 검증하고 오류 분류를 안정적으로 출력합니다.",
          code: "import json\n\ndef validate_student(value):\n    if not isinstance(value, dict):\n        raise ValueError('root must be an object')\n    if set(value) != {'name', 'scores'}:\n        raise ValueError('fields must be name and scores')\n    if not isinstance(value['name'], str) or not value['name'].strip():\n        raise ValueError('name must be a non-empty string')\n    scores = value['scores']\n    if not isinstance(scores, list) or not scores:\n        raise ValueError('scores must be a non-empty array')\n    if any(type(score) is not int or not 0 <= score <= 100 for score in scores):\n        raise ValueError('each score must be an integer from 0 to 100')\n    return {'name': value['name'].strip(), 'average': sum(scores) / len(scores)}\n\npayloads = [\n    '{\"name\": \" 둘리 \" , \"scores\": [90, 80]}',\n    '{\"name\": \"둘리\", \"scores\": [true]}',\n    '{\"name\": \"둘리\"}',\n    '{bad json}',\n]\n\nfor index, text in enumerate(payloads, 1):\n    try:\n        result = validate_student(json.loads(text))\n        print(f'{index}: OK {result}')\n    except json.JSONDecodeError as error:\n        print(f'{index}: JSON_ERROR line={error.lineno} col={error.colno}')\n    except ValueError as error:\n        print(f'{index}: SCHEMA_ERROR {error}')",
          walkthrough: [
            { lines: "3-15", explanation: "root object, 정확한 field 집합, non-empty name, non-empty scores, bool을 제외한 정확한 int와 0~100 범위를 순서대로 검증합니다." },
            { lines: "16", explanation: "검증된 값만 정제된 내부 결과로 변환합니다." },
            { lines: "18-23", explanation: "정상, bool-as-int 경계, field 누락, JSON 문법 오류 네 payload를 준비합니다." },
            { lines: "25-32", explanation: "parsing 오류 JSONDecodeError와 domain ValueError를 분리하고 원문 전체 대신 위치·분류만 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "json_validation.py로 저장"], command: "python json_validation.py" },
          output: { value: "1: OK {'name': '둘리', 'average': 85.0}\n2: SCHEMA_ERROR each score must be an integer from 0 to 100\n3: SCHEMA_ERROR fields must be name and scores\n4: JSON_ERROR line=1 col=2", explanation: ["첫 payload는 name 공백을 정제하고 평균을 계산합니다.", "JSON true는 Python True로 parse되지만 type(score) is not int 검사로 점수에서 거부됩니다.", "누락 field는 우연한 KeyError 전에 schema 오류가 되고 문법 오류는 line·column으로 구분됩니다."] },
          experiments: [
            { change: "type(score) is not int를 not isinstance(score, int)로 바꿉니다.", prediction: "True가 int 하위 타입으로 인정되어 점수 1처럼 통과합니다.", result: "언어 타입 관계와 domain 허용 타입은 별도로 정해야 합니다." },
            { change: "set(value) != ... 검사를 required <= set(value)로 바꿉니다.", prediction: "추가 field를 허용하고 필수 두 field만 있으면 통과합니다.", result: "forward compatibility와 오타 검출 사이의 additional field 정책을 명시해야 합니다." },
          ],
          sourceRefs: ["py-json-source", "python-json-doc"],
        },
      ],
      diagnostics: [
        { symptom: "json.loads는 성공했는데 이후 코드에서 KeyError·TypeError·잘못된 계산이 발생한다.", likelyCause: "JSON 문법만 parse하고 애플리케이션 schema·타입·범위를 검증하지 않았습니다.", checks: ["최상위 type과 required/extra key를 확인합니다.", "각 field의 실제 type, bool/int 경계, 빈 값과 범위를 검사합니다.", "검증 전에 domain 객체를 생성하거나 DB에 저장하는지 봅니다."], fix: "trust boundary에서 parse 후 schema validation을 실행하고 검증된 data만 내부 model로 변환합니다.", prevention: "누락·추가·wrong type·경계·중첩·버전별 contract fixture를 유지합니다." },
      ],
    },
    {
      id: "number-and-object-edge-cases",
      title: "숫자 정밀도·NaN·중복 key는 언어 간 상호운용 정책을 명시해야 합니다",
      lead: "Python json 기본 동작 일부는 JavaScript·엄격 JSON parser·금액 domain과 기대가 다를 수 있습니다.",
      explanations: [
        "Python int는 임의 정밀도지만 JavaScript Number는 모든 큰 정수를 정확히 표현하지 못합니다. 64-bit ID나 2^53보다 큰 값을 JSON number로 보내면 소비자에서 반올림될 수 있습니다. 식별자는 문자열로 보내거나 양쪽이 합의한 범위를 검증합니다.",
        "json.dumps(float('nan'))는 기본적으로 NaN을 출력할 수 있지만 표준 JSON number가 아니며 엄격한 다른 parser가 거부합니다. allow_nan=False로 NaN·Infinity를 ValueError로 막고 null 또는 명시 오류처럼 domain 정책을 선택합니다.",
        "금액을 float JSON number로 왕복하면 0.1 같은 값의 이진 정밀도 문제가 남습니다. json.loads(text, parse_float=Decimal)로 읽을 수 있지만 dump 시 Decimal 표현을 다시 정해야 합니다. amount minor unit 정수 또는 decimal 문자열과 currency를 함께 쓰는 schema가 명확합니다.",
        "JSON object에 같은 key가 두 번 나오면 Python 기본 loads는 마지막 값을 남길 수 있습니다. 공격자가 앞 검증 계층과 뒤 소비 계층의 중복 처리 차이를 악용할 수 있습니다. object_pairs_hook로 duplicate를 거부하거나 생산자 단계에서 unique key를 보장합니다.",
      ],
      concepts: [
        { term: "interoperability", definition: "서로 다른 언어·runtime·library가 같은 JSON 문서를 같은 의미로 처리할 수 있는 성질입니다.", detail: ["숫자 범위·NaN·중복 key 정책이 중요합니다.", "Python에서 parse된다는 사실만으로 보장되지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "큰 ID가 다른 언어에서 마지막 자리가 바뀌거나 두 parser가 중복 key를 다르게 읽는다.", likelyCause: "소비자의 number 정밀도와 duplicate key 정책을 계약하지 않았습니다.", checks: ["2^53 경계 위아래 값을 왕복합니다.", "같은 key가 두 번 있는 fixture를 각 parser에서 실행합니다.", "서명·권한 검증 계층과 실제 소비 계층 parser가 같은 정책인지 확인합니다."], fix: "큰 식별자는 문자열로 표현하고 duplicate key를 입력 경계에서 거부하며 canonicalization·서명 규칙을 표준화합니다.", prevention: "모든 지원 언어의 cross-runtime fixture와 strict JSON mode를 CI에서 검증합니다." },
      ],
    },
    {
      id: "scale-version-and-safe-storage",
      title: "크기 제한·version·원자적 저장을 더해야 JSON 파일이 지속 가능한 상태 형식이 됩니다",
      lead: "json.load는 보통 문서 전체 object graph를 메모리에 만들므로 신뢰할 수 없는 큰 입력과 깊은 중첩을 제한해야 합니다.",
      explanations: [
        "표준 json.load는 streaming record parser가 아닙니다. 매우 큰 array를 읽으면 전체 list와 중첩 객체가 메모리에 만들어집니다. 파일 byte 크기·HTTP body 크기·최대 중첩·목록 길이를 parsing 전에 제한하고 대량 record는 JSON Lines나 streaming parser·DB를 고려합니다.",
        "JSON Lines는 한 줄에 독립 JSON document 하나를 두어 줄 단위 처리·append에 유리합니다. 일반 pretty JSON과 달리 각 record 안 실제 newline은 escape되어야 하고 부분 마지막 줄·깨진 record·재시도 중복 정책이 필요합니다. 확장자와 Content-Type을 일반 JSON과 구분합니다.",
        "장기 저장 schema에는 schemaVersion을 넣고 parse 뒤 version별 migration을 수행합니다. unknown 미래 version을 현재 model로 억지 해석하지 않습니다. migration은 원본 backup, idempotence, 검증, 실패 rollback과 함께 테스트합니다.",
        "설정 파일을 w로 직접 갱신하면 중간 serialization 오류로 부분 JSON이 남습니다. 같은 디렉터리 임시 파일에 dump하고 flush·필요시 fsync·다시 load/validate한 뒤 replace합니다. 여러 writer는 version compare·lock·단일 writer로 lost update를 별도 해결합니다.",
        "JSON에 password·API key를 평문 저장하지 않습니다. secret manager나 OS credential store를 사용하고 샘플 파일에는 placeholder만 둡니다. 로그에는 원문 payload 대신 크기·schema version·오류 path·request ID를 남깁니다.",
      ],
      concepts: [
        { term: "JSON Lines", definition: "각 줄이 독립적인 JSON value인 record-oriented text 형식으로 대량 data를 줄 단위 처리할 수 있습니다.", detail: ["일반 단일 JSON document와 다른 format입니다.", "부분 줄·오류 record·중복 처리 정책이 필요합니다."] },
        { term: "schema version", definition: "저장 data가 어떤 field·의미 규칙을 따르는지 식별해 명시적 migration을 가능하게 하는 version field입니다.", detail: ["애플리케이션 버전과 별도로 관리할 수 있습니다.", "unknown version은 기본 거부하거나 안전한 호환 경로를 사용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "큰 JSON 요청 하나로 메모리와 CPU가 급증하거나 서비스가 응답하지 않는다.", likelyCause: "body 크기·중첩·array 길이 제한 없이 전체 loads/load로 object graph를 만들었습니다.", checks: ["입력 byte 크기와 parse peak memory·시간을 측정합니다.", "압축 해제 후 크기와 중첩 depth를 확인합니다.", "한 요청이 worker 전체를 점유하는지 봅니다."], fix: "전송·압축 해제·parse 전후에 크기와 시간 제한을 두고 대량 record는 streaming 형식·격리 worker로 처리합니다.", prevention: "과대·깊은 중첩·긴 문자열·많은 key 합성 payload로 자원 한계 테스트와 rate limit를 적용합니다." },
      ],
      comparisons: [
        { title: "많은 record를 어떤 형식으로 저장할까요?", options: [
          { name: "하나의 JSON array", chooseWhen: "전체 문서가 작고 한 번에 읽고 교체하는 snapshot일 때", avoidWhen: "계속 append되는 대용량 event stream일 때", tradeoffs: ["하나의 표준 document입니다.", "전체 parse·전체 rewrite가 필요할 수 있습니다.", "부분 손상 복구가 어렵습니다."] },
          { name: "JSON Lines", chooseWhen: "독립 record를 줄 단위 append·streaming 처리할 때", avoidWhen: "중첩된 하나의 문서 관계와 transaction 전체가 핵심일 때", tradeoffs: ["bounded memory 처리에 유리합니다.", "record별 오류·중복·마지막 부분 줄 정책이 필요합니다.", "일반 JSON parser로 파일 전체를 읽을 수 없습니다."] },
          { name: "DB·columnar format", chooseWhen: "동시 갱신·query·transaction 또는 대규모 분석 압축이 중요할 때", avoidWhen: "사람이 읽는 작은 설정 파일이면 충분할 때", tradeoffs: ["목적에 맞는 query·동시성·압축을 제공합니다.", "운영과 schema migration 복잡도가 늘어납니다.", "JSON export는 교환 경계로 남길 수 있습니다."] },
        ] },
      ],
      expertNotes: ["JSON canonicalization과 digital signature는 sort_keys만으로 충분하지 않습니다. 숫자·Unicode·whitespace를 포함한 합의된 canonical 표준을 사용합니다.", "parser differential이 인증·권한 우회로 이어지지 않도록 gateway와 application이 duplicate key·number·Unicode를 같은 정책으로 처리하게 합니다."],
    },
  ],
  lab: {
    title: "version 있는 학습 진도 JSON 저장소",
    scenario: "학습 세션 진도를 UTF-8 JSON 파일로 저장·읽고 v1에서 v2로 migration하며 손상·동시 쓰기·민감 로그를 통제합니다.",
    setup: ["progress_store.py와 test_progress_store.py를 만듭니다.", "테스트는 TemporaryDirectory와 합성 사용자 ID만 사용합니다.", "v2 schema는 schemaVersion, learnerId, sessions, updatedAtUtc를 가집니다."],
    steps: ["to_json_model에서 datetime을 timezone 포함 ISO 8601 문자열로 바꾸고 session progress 범위를 검증합니다.", "json.dumps(...,ensure_ascii=False,allow_nan=False) 문자열 round-trip을 먼저 테스트합니다.", "load는 파일 byte 제한을 확인하고 JSONDecodeError와 schema 오류를 분리합니다.", "v1의 completedSlugs를 v2 sessions object로 바꾸는 순수 migration 함수를 만듭니다.", "unknown schemaVersion과 추가 민감 field를 거부합니다.", "save는 같은 디렉터리 임시 파일에 dump하고 다시 load·validate한 뒤 os.replace합니다.", "동시에 두 writer가 같은 version을 갱신할 때 lost update를 감지하는 revision field 또는 lock 정책을 넣습니다.", "로그에는 learnerId hash·version·오류 field path만 남기고 전체 payload는 남기지 않습니다.", "정상·한글·빈 sessions·NaN·bool-as-int·중복 key·과대 파일·중간 write 실패·unknown version을 테스트합니다."],
    expectedResult: ["한글과 UTC 시간이 UTF-8 JSON으로 의미를 보존해 왕복됩니다.", "parse 오류·schema 오류·version 오류가 구분됩니다.", "v1 data가 결정적인 v2 model로 migration되고 다시 실행해도 같은 결과입니다.", "serialization 중 실패해도 이전 완성 파일이 남습니다.", "큰 입력과 NaN·잘못된 progress가 내부 model로 들어오지 않습니다.", "오류 관찰성은 유지하면서 민감 payload 원문은 노출하지 않습니다."],
    cleanup: ["TemporaryDirectory가 모든 합성 파일을 제거합니다.", "실패 임시 파일 recovery 경로도 테스트 뒤 정리합니다."],
    extensions: ["JSON Lines event log에서 snapshot을 재구성합니다.", "HMAC 서명과 replay·key rotation 정책을 추가합니다.", "JSON Schema로 여러 언어 producer를 검증합니다.", "SQLite transaction 저장소로 교체해 같은 repository contract를 유지합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 student를 dumps/loads와 dump/load 두 방식으로 왕복하고 타입 표를 작성하세요.", requirements: ["ensure_ascii True·False와 indent 유무를 비교합니다.", "tuple·None·bool·정수 key를 하나씩 추가합니다.", "전후 값·type·equality·identity를 기록합니다.", "UTF-8 임시 파일과 with를 사용합니다."], hints: ["type을 field별로 출력합니다.", "dumps의 반환은 str이고 dump의 반환을 data로 사용하지 않습니다."], expectedOutcome: "JSON text와 Python 객체, 문자열과 파일 API, 표현과 의미 보존을 구분합니다.", solutionOutline: ["기본 원본을 먼저 실행합니다.", "한 field씩 경계를 추가합니다.", "차이를 표와 테스트로 고정합니다."] },
    { difficulty: "응용", prompt: "상품 catalog JSON import/export를 구현하세요.", requirements: ["schemaVersion·sku 문자열·name·price decimal 문자열·tags를 검증합니다.", "unknown·duplicate sku·추가 field 정책을 정합니다.", "NaN·bool 가격·큰 ID·한글·빈 목록을 테스트합니다.", "입력 크기 제한과 원자적 export를 구현합니다.", "오류 record path를 보고하되 전체 상품 원문을 로그에 남기지 않습니다."], hints: ["Decimal을 float로 바로 바꾸지 않습니다.", "parse와 domain validation 함수를 분리합니다."], expectedOutcome: "정밀도와 version이 명시된 상호운용 가능한 catalog 경계를 만듭니다." },
    { difficulty: "설계", prompt: "외부 파트너 webhook JSON 수신 pipeline을 설계하세요.", requirements: ["body·압축 해제 크기·시간·rate limit를 정의합니다.", "서명 검증에 사용하는 raw bytes와 parse 단계 순서를 설명합니다.", "duplicate key·큰 number·NaN·Unicode normalization 정책을 정합니다.", "version별 schema·migration과 unknown version 처리를 포함합니다.", "idempotency·replay·dead-letter·관찰성·민감 로그 정책을 설계합니다.", "gateway와 application parser differential test를 제시합니다."], hints: ["parse 성공이 인증 성공이나 schema 성공을 뜻하지 않습니다.", "서명 전에 text를 다시 serialize하면 bytes가 달라질 수 있습니다."], expectedOutcome: "JSON 문법을 넘어 인증·상호운용·자원 제한·운영 복구를 포함한 신뢰 경계를 제안합니다." },
  ],
  reviewQuestions: [
    { question: "json.dumps와 json.dump의 차이는 무엇인가요?", answer: "dumps는 JSON str을 반환하고 dump는 열린 text file-like 객체에 JSON text를 씁니다." },
    { question: "ensure_ascii=False가 파일을 자동으로 UTF-8로 만드나요?", answer: "아닙니다. 비ASCII 표시 방식을 정할 뿐이며 파일 encoding은 open(...,encoding='utf-8')에서 별도로 지정합니다." },
    { question: "tuple은 JSON 왕복 뒤 어떤 타입이 되나요?", answer: "JSON array로 직렬화되고 json.loads 뒤 Python list가 됩니다." },
    { question: "json.loads가 성공하면 애플리케이션에서 안전하게 써도 되나요?", answer: "아닙니다. 문법 parsing만 성공한 것이므로 root 타입·필수 field·추가 field·값 타입·범위·관계를 별도 검증해야 합니다." },
    { question: "왜 score에서 isinstance(True, int)가 위험할 수 있나요?", answer: "Python bool이 int의 하위 타입이라 True가 숫자 1처럼 통과할 수 있으므로 domain상 bool을 금지하려면 정확한 타입 검사가 필요합니다." },
    { question: "NaN을 상호운용 JSON에서 어떻게 다루나요?", answer: "표준 JSON number가 아니므로 allow_nan=False로 거부하고 null·오류 등 명시적 domain 정책을 선택합니다." },
    { question: "큰 정수 ID를 JSON number로 보내면 어떤 문제가 있나요?", answer: "JavaScript 같은 소비자의 정밀도 범위를 넘으면 값이 반올림될 수 있어 문자열 표현이나 범위 계약이 필요합니다." },
    { question: "중요 JSON 파일을 안전하게 갱신하는 기본 패턴은 무엇인가요?", answer: "같은 디렉터리 임시 파일에 완성본을 쓰고 parse·schema 검증한 뒤 os.replace로 교체하며 동시 writer는 별도 조정합니다." },
  ],
  completionChecklist: [
    "JSON 공통 타입과 Python type mapping을 표로 설명할 수 있다.",
    "dumps·loads와 dump·load를 문자열·파일 경계에 맞게 사용할 수 있다.",
    "한글 표시와 UTF-8 encoding의 역할을 구분할 수 있다.",
    "tuple·정수 key·datetime·Decimal·set의 손실 없는 domain 표현을 설계할 수 있다.",
    "parse 뒤 root·field·타입·범위·추가 field를 검증할 수 있다.",
    "NaN·중복 key·큰 정수·float 정밀도 상호운용 문제를 진단할 수 있다.",
    "크기 제한·JSON Lines·schemaVersion을 data 규모와 수명에 맞게 선택할 수 있다.",
    "원자적 저장·동시 writer·secret·민감 로그 정책을 적용할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-json-source", repository: "PYTHON-BASIC", path: "day05/ex08_json.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex08_json.py", usedFor: ["student dict", "dumps·loads", "ensure_ascii=False", "indent", "dump·load", "UTF-8 임시 파일"], evidence: "원본을 Python 3.13.9에서 실행해 여러 줄 한글 JSON, restored 이름·점수, 파일에서 읽은 Python dict 출력이 일치함을 확인했습니다." },
    { id: "py-day05-json-note", repository: "PYTHON-BASIC", path: "notes/day05_lambda_file_excel.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day05_lambda_file_excel.md", usedFor: ["문자열/파일 API 표", "ensure_ascii", "JSON 활용 맥락"], evidence: "Day05 노트의 dumps/loads와 dump/load 구분을 유지하고 타입 손실·schema·운영 경계로 확장했습니다." },
    { id: "python-json-doc", repository: "Python documentation", path: "library/json.html", publicUrl: "https://docs.python.org/3/library/json.html", usedFor: ["Python↔JSON type 표", "encoder option", "parse hook", "NaN", "중복 key", "보안 주의"], evidence: "공식 json module 문서의 conversion table·option·decoder hook·resource warning을 오류 진단과 상호운용 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["HTTP API client 자체와 authentication은 웹/API 과정에서 별도 다룹니다.", "Decimal·datetime·schema validation·duplicate key·JSON Lines·atomic version migration은 원본 왕복 예제를 전문가 운영 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;
