import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-015"],
  slug: "python-015-input-conversion-validation-boundary",
  courseId: "python",
  moduleId: "01-language-foundations",
  order: 15,
  title: "입력·형 변환·검증 경계",
  subtitle: "input이 반환하는 str을 그대로 신뢰하지 않고 정규화·파싱·범위 검증·도메인 사용 단계로 나눕니다.",
  level: "기초",
  estimatedMinutes: 110,
  coreQuestion: "사용자가 입력한 텍스트를 계산 가능한 내부 값으로 바꾸면서 잘못된 입력과 실행 환경 차이를 어떻게 안전하게 처리할까요?",
  summary: "input의 prompt·표준입력·줄바꿈 제거와 항상 str인 반환 계약을 확인합니다. int·float 파싱 실패, 공백·부호·범위·세 점수 검증을 단계별로 설계하고 ValueError·EOFError를 진단합니다. 내장 sum 이름 가리기, 비밀번호 입력, 무제한 길이, 테스트 가능한 순수 파싱 함수와 CLI 도구 선택까지 다룹니다.",
  objectives: [
    "input이 표준입력 한 줄을 읽고 줄바꿈을 제거한 str을 반환한다는 사실을 설명할 수 있다.",
    "원본 문자열, 정규화 문자열, 파싱 숫자, 검증된 도메인 값을 별도 단계로 관리할 수 있다.",
    "int·float 변환의 성공 형식과 ValueError를 대표 입력으로 진단할 수 있다.",
    "점수·나이·수량처럼 숫자 타입만으로 충분하지 않은 범위 규칙을 검증할 수 있다.",
    "EOFError·비대화형 실행·인코딩·비밀 입력 문제를 환경과 코드 관점에서 구분할 수 있다.",
    "입력과 계산을 분리해 자동 테스트 가능한 프로그램 구조를 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "숫자형과 형 변환", reason: "str을 int·float로 바꿀 때 정보·오류·표시 형식을 구분합니다.", sessionSlug: "python-004-numeric-types-conversion" },
    { title: "문자열 메서드와 검증", reason: "strip·문자 검사와 원본·정규화 값 분리 원칙을 사용합니다.", sessionSlug: "python-009-string-methods-validation" },
  ],
  keywords: ["Python", "input", "stdin", "parsing", "validation", "ValueError", "EOFError", "boundary", "CLI", "getpass"],
  chapters: [
    {
      id: "standard-input-contract",
      title: "input은 prompt를 출력하고 표준입력 한 줄을 str로 읽습니다",
      lead: "화면에 숫자를 입력해도 input 결과는 숫자 객체가 아니라 줄바꿈이 제거된 문자열입니다.",
      explanations: [
        "name=input('이름 : ')을 실행하면 prompt를 표준출력에 쓰고 사용자가 Enter를 누를 때까지 표준입력에서 읽습니다. 끝의 줄바꿈은 결과에 포함하지 않지만 Enter 앞 공백은 남을 수 있습니다. 빈 줄은 빈 문자열 ''입니다.",
        "'90'을 입력해도 type은 str입니다. 문자열 +는 연결이므로 kor='90', eng='80'에서 kor+eng는 '9080'입니다. 계산 전에 int 또는 float로 명시 파싱해야 합니다. 입력을 받은 직후 type과 repr을 관찰하면 공백·빈 값·보이지 않는 문자를 찾기 쉽습니다.",
        "표준입력은 키보드만 뜻하지 않습니다. 파일·파이프·테스트 도구가 줄을 제공할 수 있습니다. 원본 예제는 네 줄을 파이프로 주어도 같은 결과를 냅니다. 실행 결과를 재현하려면 입력 값과 순서를 함께 기록해야 합니다.",
      ],
      concepts: [
        { term: "표준입력(stdin)", definition: "프로그램이 기본적으로 텍스트 입력을 읽는 스트림입니다.", detail: ["터미널 키보드, 파이프, 파일 리다이렉션이 연결될 수 있습니다.", "입력이 더 이상 없으면 input은 EOFError를 낼 수 있습니다."] },
        { term: "prompt", definition: "사용자에게 어떤 값을 입력할지 안내하기 위해 input이 읽기 전에 출력하는 문자열입니다.", detail: ["입력 형식·단위·범위를 알려야 합니다.", "비대화형 로그에서는 prompt가 같은 줄에 이어질 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "score-input-baseline",
          title: "세 점수를 입력해 총점과 평균 계산",
          language: "python",
          filename: "score_input.py",
          purpose: "원본 ex04_input.py의 입력 순서와 출력 결과를 재현하면서 str→int 경계를 표시합니다.",
          code: "name = input('이름 : ')\nkor_text = input('국어점수 : ')\neng_text = input('영어점수 : ')\nmath_text = input('수학점수 : ')\n\nkor = int(kor_text)\neng = int(eng_text)\nmath = int(math_text)\ntotal = kor + eng + math\naverage = total / 3\n\nprint(f'{name=}')\nprint(f'{total=}')\nprint(f'{average=:.2f}')\nprint(type(kor_text).__name__, type(kor).__name__)",
          walkthrough: [
            { lines: "1-4", explanation: "원본 텍스트를 *_text 이름으로 보존합니다. 네 input은 순서대로 한 줄씩 소비합니다." },
            { lines: "6-8", explanation: "각 점수 문자열을 int로 파싱합니다. 한 줄이라도 잘못되면 해당 줄에서 ValueError로 중단합니다." },
            { lines: "9-10", explanation: "int 합계와 / 연산의 float 평균을 계산합니다. 내장 함수 sum을 가리지 않도록 total 이름을 씁니다." },
            { lines: "12-15", explanation: "이름·합계·평균과 변환 전후 str/int 타입을 출력합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "PowerShell 또는 터미널"], command: "python score_input.py", input: "둘리\n90\n80\n70" },
          output: { value: "이름 : 국어점수 : 영어점수 : 수학점수 : name='둘리'\ntotal=240\naverage=80.00\nstr int", explanation: ["검증기는 입력을 pipe로 전달하므로 terminal echo 없이 네 prompt가 이어집니다. 대화형 터미널에서는 사용자가 입력한 둘리·90·80·70이 각 prompt 뒤에 보입니다.", "평균은 float 80.0이지만 .2f 표시가 80.00 문자열 모양을 만듭니다.", "kor_text와 kor 타입 출력이 입력과 내부 계산 값 경계를 증명합니다."] },
          experiments: [
            { change: "국어점수에 90.5를 입력합니다.", prediction: "int('90.5')가 정수 리터럴 형식이 아니라 ValueError입니다.", result: "소수 점수를 허용하려면 float 파싱과 범위 정책을 별도로 정해야 합니다." },
            { change: "점수 한 줄을 비워 Enter를 누릅니다.", prediction: "int('')에서 ValueError입니다.", result: "빈 값 정책과 반복 입력·취소 흐름이 필요함을 확인합니다." },
          ],
          sourceRefs: ["py-input-basic", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "parse-dont-cast-blindly",
      title: "형 변환보다 파싱이라는 관점으로 입력 문법을 확인합니다",
      lead: "int(text)는 아무 문자열을 숫자로 ‘바꾸는’ 마법이 아니라 정수 표기 문법을 해석하고 실패할 수 있는 파서입니다.",
      explanations: [
        "int('90')과 int('  -12  ')는 성공하지만 int('90.0'), int('1,000'), int('십')은 실패합니다. 쉼표·단위가 허용되는 UI라면 제거 규칙과 지역화를 명시해야 합니다. 무작정 모든 문자를 삭제하면 악성·오타 입력을 다른 숫자로 왜곡할 수 있습니다.",
        "float('3.14'), float('1e3')은 성공하며 float('nan'), float('inf')도 특수 값을 만들 수 있습니다. 일반 점수·가격에서 NaN·무한대를 허용하지 않으려면 math.isfinite로 검증합니다. 파싱 성공이 도메인 유효성을 뜻하지 않습니다.",
        "str.isdigit은 간단한 양의 숫자 문자 검사에 유용하지만 음수·공백·소수·과학 표기를 거부하고 일부 Unicode 숫자를 True로 보면서 int가 기대와 다르게 처리할 수 있습니다. 실제 파서와 구체 예외를 사용하는 편이 정확한 경우가 많습니다.",
        "int(text,base)로 2·8·16진 문자열을 읽을 수 있고 base=0은 0x 같은 접두사를 해석합니다. 일반 사용자 점수에 0x10을 허용할지 명시하지 않으면 십진수만 받아야 합니다.",
      ],
      concepts: [
        { term: "파싱", definition: "텍스트가 정의된 문법을 따르는지 확인하고 구조화된 타입 값으로 해석하는 과정입니다.", detail: ["실패 가능성과 입력 문법이 계약의 일부입니다.", "파싱 성공 후에도 범위·업무 검증이 필요합니다."] },
        { term: "특수 부동소수점", definition: "NaN과 양·음의 infinity처럼 일반 유한 실수가 아닌 float 값입니다.", detail: ["float 문자열 파서가 만들 수 있습니다.", "비교·집계·JSON 직렬화 정책을 명시해야 합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "ValueError: invalid literal for int() with base 10이 발생한다.", likelyCause: "빈 값·소수점·쉼표·단위·문자가 포함된 문자열을 십진 int로 파싱했습니다.", checks: ["오류 입력을 민감정보를 제외하고 repr로 확인합니다.", "strip 전후와 허용 입력 문법을 비교합니다.", "정수·소수·지역화 숫자 중 실제 요구 타입을 정합니다."], fix: "정규화와 허용 문법을 명시하고 적절한 int·float·Decimal·지역화 파서를 사용해 구체 오류를 사용자에게 반환합니다.", prevention: "빈·공백·부호·소수·쉼표·매우 큰 수·문자 입력 테스트를 둡니다." },
      ],
    },
    {
      id: "validation-pipeline",
      title: "원본 → 정규화 → 파싱 → 범위 → 도메인 사용 순서를 지킵니다",
      lead: "각 단계가 다른 실패를 담당하게 하면 오류 메시지와 테스트가 명확해집니다.",
      explanations: [
        "raw는 사용자가 보낸 원본, normalized=raw.strip()은 공백 정책 적용, parsed=int(normalized)은 문법 해석, validated는 0<=score<=100을 통과한 값입니다. 한 줄 int(input())은 짧지만 어느 단계가 실패했는지와 원본 보존이 어렵습니다.",
        "이름은 strip 후 빈 값, 최대 길이, 제어 문자, 허용 Unicode 정책을 검사합니다. 점수는 int 파싱 뒤 범위 0~100을 검사합니다. 101은 int 파싱에 성공하지만 유효 점수는 아닙니다.",
        "여러 필드에서 모든 오류를 한 번에 모을지 첫 오류에서 중단할지 UI 요구에 따라 정합니다. 웹 폼은 필드별 오류를 모으고, 명령행 반복 입력은 즉시 다시 묻는 방식이 자연스러울 수 있습니다.",
        "검증 후에도 신뢰 경계를 문서화합니다. DB constraint와 서버 측 검증을 함께 두고 클라이언트 검증만 신뢰하지 않습니다.",
      ],
      concepts: [
        { term: "검증 경계", definition: "외부의 자유로운 입력을 내부에서 신뢰 가능한 값으로 전환하는 지점과 규칙입니다.", detail: ["정규화·파싱·범위·도메인 불변식을 포함합니다.", "실패 이유와 원본 보존·로그 정책을 정합니다."] },
        { term: "도메인 불변식", definition: "프로그램이 정상 상태에서 항상 만족해야 하는 업무 규칙입니다.", detail: ["점수 0~100, total>0 같은 조건입니다.", "타입이 맞아도 불변식을 위반할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "validated-score-parser",
          title: "한 점수의 파싱·범위 오류 분리",
          language: "python",
          filename: "validated_score.py",
          purpose: "입력 한 줄을 단계별로 처리하고 문법 오류와 범위 오류를 서로 다른 메시지로 보여 줍니다.",
          code: "raw = input('점수(0~100) : ')\ntext = raw.strip()\n\ntry:\n    score = int(text)\nexcept ValueError:\n    print('오류: 정수를 입력하세요.')\nelse:\n    if not 0 <= score <= 100:\n        print('오류: 점수는 0~100이어야 합니다.')\n    else:\n        print(f'검증된 점수: {score}')",
          walkthrough: [
            { lines: "1-2", explanation: "원본과 양끝 공백을 제거한 문자열을 분리합니다." },
            { lines: "4-7", explanation: "int 문법 오류만 ValueError로 잡습니다. try/except 자세한 의미는 예외 세션에서 다시 다룹니다." },
            { lines: "8-12", explanation: "파싱이 성공한 else에서 범위를 검사해 문법·도메인 오류를 구분합니다." },
            { lines: "12", explanation: "두 경계를 모두 통과한 int만 내부 검증 값으로 사용합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "validated_score.py를 저장"], command: "python validated_score.py", input: "101" },
          output: { value: "점수(0~100) : 오류: 점수는 0~100이어야 합니다.", explanation: ["검증기의 pipe 입력은 101을 terminal에 echo하지 않지만 대화형 실행에서는 prompt 뒤에 사용자가 입력한 101이 보입니다.", "101은 정수 파싱에 성공하므로 ‘정수를 입력’ 오류가 아닙니다.", "입력을 abc로 바꾸면 ValueError 경로의 문법 오류가 출력되고 입력 100은 포함 경계라 검증 성공입니다."] },
          experiments: [
            { change: "입력을 ' 90 '으로 사용합니다.", prediction: "strip 후 90으로 파싱되어 성공합니다.", result: "공백 정규화 정책이 먼저 적용됩니다." },
            { change: "입력을 'nan'으로 하고 int를 float로 바꿉니다.", prediction: "파싱은 성공하지만 범위 비교가 False여서 범위 오류입니다.", result: "실수 입력에서는 math.isfinite 검증을 명시하는 편이 오류 이유를 정확히 합니다." },
          ],
          sourceRefs: ["py-input-basic", "py-day03-note"],
        },
      ],
      diagnostics: [],
    },
    {
      id: "retry-cancel-eof",
      title: "다시 입력·취소·입력 종료는 서로 다른 상태입니다",
      lead: "잘못된 값은 다시 묻고, 사용자가 취소한 값과 표준입력이 끝난 EOF는 명시적으로 처리해야 합니다.",
      explanations: [
        "대화형 프로그램은 while 반복 안에서 input→파싱→검증을 수행하고 성공 시 break할 수 있습니다. 무한 반복을 피하려면 취소 문자열·최대 시도 횟수·EOF 정책을 둡니다. 반복문은 py-018~019에서 깊게 학습합니다.",
        "파이프나 자동 실행에서 필요한 줄보다 입력이 적으면 input은 EOFError입니다. ‘사용자가 빈 줄 입력’은 '' 반환, EOF는 예외라 다릅니다. CI·GitHub Pages 빌드에서 대화형 input 코드를 실행하면 멈추거나 EOF가 날 수 있어 예제 실행 도구가 interactive 파일을 분리해야 합니다.",
        "Ctrl+C는 KeyboardInterrupt, Unix Ctrl+D 또는 Windows Ctrl+Z+Enter는 EOF를 만들 수 있습니다. 사용자 종료를 traceback으로 보여 주지 않고 명확한 종료 코드·메시지로 처리하되 라이브러리 깊은 곳에서 모든 BaseException을 잡지 않습니다.",
      ],
      concepts: [
        { term: "EOF", definition: "입력 스트림에서 더 읽을 데이터가 없다는 상태입니다.", detail: ["input은 EOFError로 알립니다.", "빈 줄 문자열과 구분됩니다."] },
        { term: "취소 계약", definition: "사용자가 작업을 끝내거나 입력을 포기할 때 사용할 값·신호·종료 상태에 대한 약속입니다.", detail: ["빈 값이 취소인지 유효 기본값인지 정합니다.", "자동 실행에서는 exit code와 stderr 정책도 포함합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "EOFError: EOF when reading a line이 발생한다.", likelyCause: "input이 읽을 표준입력 줄이 더 없거나 비대화형 환경에서 입력을 제공하지 않았습니다.", checks: ["프로그램이 요구하는 input 호출 수와 제공한 줄 수를 비교합니다.", "터미널·파이프·CI 중 실행 환경을 확인합니다.", "이 코드가 자동화 경로에서 대화형 입력을 요구하는지 봅니다."], fix: "필요 입력을 파이프·인수·파일로 제공하거나 EOF를 명시적 취소/오류로 처리합니다.", prevention: "입력 로직과 계산을 분리하고 CLI 인수·테스트 주입을 지원합니다." },
      ],
    },
    {
      id: "names-and-builtins",
      title: "입력값 이름과 내장 함수 이름을 충돌시키지 않습니다",
      lead: "원본의 sum 변수는 총점을 표현하지만 Python 내장 sum 함수를 같은 이름 공간에서 가립니다. total처럼 의미 있는 이름을 사용합니다.",
      explanations: [
        "sum=kor+eng+math 뒤에는 같은 범위에서 sum([1,2,3])을 호출할 수 없습니다. int 객체를 함수처럼 호출해 TypeError가 납니다. str, list, dict, input 같은 내장 이름도 변수로 가리지 않습니다.",
        "score_text, score, validated_score처럼 단계가 드러나는 이름을 쓰면 타입 전환을 추적하기 쉽습니다. raw 값에 다시 int를 덮어써도 동작하지만 오류 로그와 재검증에 원본이 필요할 수 있습니다.",
        "민감 입력은 raw를 오래 보존하지 않습니다. 비밀번호·토큰은 일반 input이 화면에 그대로 보이므로 getpass.getpass를 사용하고, 필요 최소 시간만 메모리에 두며 로그·traceback에 포함하지 않습니다.",
      ],
      concepts: [
        { term: "이름 가리기(shadowing)", definition: "현재 이름 공간의 변수가 바깥 또는 내장 이름과 같아 원래 객체 접근을 가리는 현상입니다.", detail: ["sum=240은 내장 sum 함수를 가립니다.", "코드가 길어질수록 뒤에서 예상치 못한 TypeError를 만듭니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "TypeError: 'int' object is not callable가 sum(...)에서 발생한다.", likelyCause: "앞에서 sum 이름에 int 총점을 대입해 내장 함수를 가렸습니다.", checks: ["print(sum, type(sum))으로 현재 바인딩을 확인합니다.", "같은 범위에서 sum= 대입을 검색합니다.", "다른 내장 str·list·input도 가렸는지 린터를 확인합니다."], fix: "변수를 total처럼 바꾸고 현재 세션에서는 재시작하거나 del로 잘못된 바인딩을 제거합니다.", prevention: "린터의 builtins shadow 경고와 설명적 도메인 이름을 사용합니다." },
      ],
    },
    {
      id: "input-security-limits",
      title: "사용자 입력은 길이·형식·자원·비밀 관점에서 신뢰하지 않습니다",
      lead: "int로 변환된다는 사실만으로 안전한 값이 되지 않습니다. 지나치게 긴 숫자와 문자열, 제어 문자와 주입 컨텍스트를 제한합니다.",
      explanations: [
        "최신 Python은 지나치게 긴 십진 정수 문자열 변환에 기본 자릿수 제한을 둘 수 있지만 애플리케이션도 업무 범위를 정해야 합니다. 점수 입력은 최대 몇 글자만 필요합니다. 파싱 전에 text 길이를 검사하면 불필요한 CPU·메모리 사용과 터무니없는 오류를 줄입니다.",
        "사용자 이름에 줄바꿈·ANSI 제어 문자가 들어가면 터미널 로그를 위조하거나 화면을 조작할 수 있습니다. 표시와 로그에는 제어 문자를 escape하고, 허용 문자 정책은 국제화 요구와 함께 정합니다.",
        "검증된 문자열도 SQL·shell·HTML에 직접 이어 붙이면 주입 위험이 있습니다. SQL parameter, subprocess 인수 배열, 템플릿 autoescape처럼 각 출력 컨텍스트의 안전한 API를 사용합니다. input 검증이 escaping을 대신하지 않습니다.",
        "비밀번호·API key는 input prompt에 값을 되풀이하지 않고 출력·디버깅 f-string에 넣지 않습니다. 이미 노출한 비밀은 마스킹만으로 끝내지 말고 회전합니다.",
      ],
      concepts: [
        { term: "신뢰 경계", definition: "외부 데이터가 내부 시스템으로 들어오며 검증·제한·권한 정책을 적용해야 하는 지점입니다.", detail: ["터미널 입력도 외부 입력입니다.", "검증 후에도 출력 컨텍스트별 안전 API가 필요합니다."] },
        { term: "입력 자원 제한", definition: "허용 길이·숫자 범위·시도 횟수·처리 시간을 제한하는 정책입니다.", detail: ["정상 업무 범위를 코드로 표현합니다.", "자원 고갈과 비정상 데이터 축적을 방지합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      expertNotes: ["보안 입력에는 getpass를 사용해도 프로세스 메모리·키로거·터미널 환경까지 모두 해결되는 것은 아닙니다. 비밀 수명과 권한을 최소화합니다."],
    },
    {
      id: "testable-input-architecture",
      title: "input 호출과 계산을 분리해야 자동 테스트할 수 있습니다",
      lead: "대화형 껍데기는 문자열을 읽고, 순수 함수는 문자열을 파싱·검증하며, 계산 함수는 이미 검증된 타입만 받게 만듭니다.",
      explanations: [
        "모든 로직을 input 호출 아래 한 파일에 두면 테스트가 키보드 입력에 의존합니다. parse_score(text)->int, calculate_average(scores)->float처럼 분리하면 정상·오류 문자열을 함수에 직접 전달해 빠르게 테스트할 수 있습니다.",
        "CLI가 커지면 argparse·Typer류로 옵션·도움말·필수 인수를 관리합니다. 대화형 input은 튜토리얼과 작은 도구에 적합하지만 자동화·스크립트 조합에는 명령행 인수·stdin format·exit code 계약이 필요합니다.",
        "오류 메시지는 사용자용 한국어 설명과 개발자용 원인·field code를 구분합니다. stdout에는 정상 데이터, stderr에는 오류를 쓰면 파이프 사용이 쉬워집니다. 비밀 원본은 어느 쪽에도 출력하지 않습니다.",
        "테스트는 '90', ' 90 ', '', '90.0', '-1', '101', 매우 긴 수, Unicode 숫자, EOF를 포함합니다. 대표 정상값 하나로는 파서 계약을 보장할 수 없습니다.",
      ],
      concepts: [
        { term: "순수 파싱 함수", definition: "외부 I/O를 직접 하지 않고 입력 값에서 결과 또는 구체 오류를 반환하는 함수입니다.", detail: ["자동 테스트와 재사용이 쉽습니다.", "출력·종료 정책을 UI 계층과 분리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "값을 어떻게 프로그램에 전달할까요?", options: [
          { name: "대화형 input", chooseWhen: "초보 실습·사람이 직접 쓰는 짧은 일회성 도구일 때", avoidWhen: "CI·배치·다른 프로그램과 조합·자동 테스트가 핵심일 때", tradeoffs: ["직관적인 질문 흐름입니다.", "입력 없으면 대기·EOF 문제가 생깁니다.", "반복 자동화가 어렵습니다."] },
          { name: "CLI 인수/구조화 stdin", chooseWhen: "자동화·재현·도움말·exit code와 파이프 조합이 필요할 때", avoidWhen: "간단한 첫 문법 실습에 과도한 구조일 때", tradeoffs: ["명령으로 재현하기 쉽습니다.", "파서와 문서 설계가 필요합니다.", "비밀을 명령행 인수에 두면 프로세스 목록에 노출될 수 있습니다."] },
        ] },
      ],
      expertNotes: ["테스트에서는 monkeypatch로 input을 바꿀 수도 있지만 핵심 로직을 순수 함수로 분리하는 것이 더 작은 테스트 경계를 만듭니다.", "명령행 비밀은 환경변수도 유출 경로가 있으므로 secret manager·stdin·OS credential store 등 위협 모델에 맞는 전달 방식을 선택합니다."],
    },
  ],
  lab: {
    title: "재시도 가능한 성적 입력기와 순수 계산 분리",
    scenario: "이름과 세 점수를 입력받되 문법·범위 오류를 필드별로 처리하고 검증된 값만 평균 계산에 전달합니다.",
    setup: ["validated_grade_cli.py를 만듭니다.", "parse_score와 calculate_result 함수 윤곽을 먼저 작성합니다.", "Python 3.11 이상에서 실행합니다."],
    steps: ["parse_score가 strip, 빈 값, 길이, int 파싱, 0~100 범위를 순서대로 처리하게 합니다.", "이름은 공백·길이·제어 문자 정책을 검증합니다.", "대화형 계층에서 각 필드 최대 3회 재시도와 q 취소를 제공합니다.", "EOFError와 KeyboardInterrupt를 사용자 종료로 처리합니다.", "검증된 int list만 total·average 계산 함수에 전달합니다.", "정상·필드별 실패·취소·EOF를 입력 없이 함수 단위 테스트합니다.", "stdout 정상 결과와 stderr 오류 정책을 문서화합니다."],
    expectedResult: ["'abc'와 101이 서로 다른 오류를 냅니다.", "검증 성공 전 계산 함수가 호출되지 않습니다.", "정상 90·80·70에서 total 240, average 80.00입니다.", "자동 테스트가 키보드 대기 없이 파서와 계산을 검증합니다."],
    cleanup: ["합성 이름·점수만 사용하고 실제 개인정보를 저장하지 않습니다."],
    extensions: ["argparse로 --name --kor --eng --math 비대화형 모드를 추가합니다.", "CSV 한 줄 입력 모드와 csv 모듈 파싱을 추가합니다.", "오류를 field·code·message 구조로 반환합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "이름과 두 정수를 input으로 받아 합을 출력하세요.", requirements: ["raw 문자열과 int 값을 다른 이름으로 둡니다.", "변환 전후 type을 출력합니다.", "빈 값과 문자 입력 ValueError를 재현합니다."], hints: ["int(input()) 한 줄로 합치지 마세요.", "repr로 공백을 확인합니다."], expectedOutcome: "표준입력·str 반환·파싱 경계를 실행 결과로 설명합니다.", solutionOutline: ["세 input을 순서대로 읽습니다.", "숫자 문자열을 int로 바꿉니다.", "정상 계산 뒤 실패 입력을 별도 실행합니다."] },
    { difficulty: "응용", prompt: "수량·단가 입력을 검증하는 주문 계산기를 만드세요.", requirements: ["수량은 1~100 int, 단가는 0 이상 원 단위 int입니다.", "쉼표 입력을 허용할지 정책을 정합니다.", "빈·음수·소수·초대형 입력 오류를 구분합니다.", "계산과 표시 f-string을 분리합니다."], hints: ["파싱 성공 후 범위를 검사합니다.", "표시 쉼표를 저장 숫자에 섞지 마세요."], expectedOutcome: "문자열 형식과 업무 범위를 분리한 주문 경계가 완성됩니다." },
    { difficulty: "설계", prompt: "자동화 가능한 데이터 수집 CLI 계약을 설계하세요.", requirements: ["대화형·명령행·stdin JSON 세 입력 모드를 비교합니다.", "schema·최대 크기·취소·EOF·exit code를 정의합니다.", "비밀 필드 전달·로그·회전 정책을 포함합니다.", "순수 파서와 I/O adapter 구조를 제시합니다.", "정상·오류·보안 경계 테스트 12개 이상을 작성합니다."], hints: ["input 검증과 SQL/shell escaping은 별도입니다.", "stdout 데이터와 stderr 오류 분리를 고려합니다."], expectedOutcome: "입문 input 코드를 재현·테스트·운영 가능한 CLI 신뢰 경계로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "input에 90을 입력하면 반환 타입은 무엇인가요?", answer: "str입니다. 계산하려면 허용 문법을 검증하고 int 등으로 파싱해야 합니다." },
    { question: "빈 줄과 EOF는 어떻게 다른가요?", answer: "빈 줄은 빈 문자열을 반환하고 EOF는 더 읽을 데이터가 없어 EOFError를 발생시킵니다." },
    { question: "int 파싱에 성공한 101이 점수로 유효하지 않은 이유는 무엇인가요?", answer: "타입·문법은 맞지만 점수 도메인 범위 0~100을 위반하기 때문입니다." },
    { question: "isdigit만으로 모든 int 입력을 검사하기 어려운 이유는 무엇인가요?", answer: "음수·공백을 거부하고 일부 Unicode 숫자 처리와 실제 int 문법이 다를 수 있기 때문입니다." },
    { question: "sum을 변수 이름으로 쓰면 어떤 문제가 생기나요?", answer: "내장 sum 함수를 가려 뒤에서 sum(...) 호출이 int object is not callable 오류를 낼 수 있습니다." },
    { question: "input 로직과 계산을 분리해야 하는 이유는 무엇인가요?", answer: "파서·계산을 키보드 대기 없이 자동 테스트하고 CLI·웹 등 다른 입력 adapter에서 재사용할 수 있기 때문입니다." },
    { question: "검증된 입력을 SQL에 f-string으로 넣어도 되나요?", answer: "아닙니다. SQL 주입 방지는 별도의 parameter binding이 필요하며 입력 검증이 컨텍스트 escaping을 대신하지 않습니다." },
  ],
  completionChecklist: [
    "input의 prompt·stdin·str·줄바꿈 제거 계약을 설명할 수 있다.",
    "원본·정규화·파싱·검증 값을 별도 단계와 이름으로 관리할 수 있다.",
    "int·float 파싱 오류와 범위 오류를 구분할 수 있다.",
    "빈 입력·EOF·취소·최대 재시도 정책을 설계할 수 있다.",
    "내장 이름 shadowing과 민감 입력 로그를 피할 수 있다.",
    "입력 길이·숫자 범위·제어 문자·주입 컨텍스트를 검토할 수 있다.",
    "I/O adapter와 순수 파싱·계산 함수를 분리해 테스트할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-input-basic", repository: "PYTHON-BASIC", path: "day03/ex04_input.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day03/ex04_input.py", usedFor: ["input str 반환", "세 점수 int 변환", "총점·평균", "대화형 실행"], evidence: "PowerShell에서 둘리·90·80·70 네 줄을 Python 3.13.9 원본에 파이프로 전달해 name 둘리, sum 240, avg 80.00 결과를 확인했습니다. 원본의 sum 이름은 total로 개선했습니다." },
    { id: "py-day03-note", repository: "PYTHON-BASIC", path: "notes/day03_collection_control.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day03_collection_control.md", usedFor: ["input·형 변환 요약", "조건 검증 연결", "셀프 체크"], evidence: "원본 노트 범위를 유지하고 파싱·범위·EOF·테스트 구조·보안 경계를 보강했습니다." },
  ],
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["if 상세는 py-016, 반복 재입력은 py-018, 예외 설계는 py-035~036에서 확장합니다.", "getpass·CLI adapter·자원 제한·주입 경계는 원본 공백을 전문가 관점으로 보강했습니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "input-adapter-eof-cancel-state-machine",
    title: "입력값·빈 줄·EOF·사용자 취소를 서로 다른 상태로 모델링합니다",
    lead: "input 성공 문자열만 생각하지 않고 stream 종료, interactive interrupt와 재시도 예산을 adapter result로 표현해야 batch·pipe·테스트 환경에서도 종료할 수 있습니다.",
    explanations: [
      "input(prompt)는 prompt를 stdout에 쓰고 한 줄을 읽어 trailing newline을 제거한 str을 반환합니다. 사용자가 Enter만 누르면 빈 문자열이며 EOF와 다릅니다.",
      "표준입력 끝에서는 input이 EOFError를 냅니다. pipe/file의 정상 종료일 수 있으므로 무조건 '잘못된 값' 재시도로 처리하면 무한 loop가 됩니다.",
      "interactive Ctrl+C는 KeyboardInterrupt입니다. 사용자 취소와 parser ValueError를 분리해 cleanup 후 명시적 exit status로 끝냅니다.",
      "readline adapter를 주입하면 input I/O와 normalize/parse/domain logic을 분리해 EOF·취소·empty를 실제 terminal 없이 결정적으로 test할 수 있습니다.",
      "재시도에는 최대 횟수·deadline과 cancellation propagation을 두고, secret prompt에는 input 대신 getpass를 사용해 화면 echo를 줄입니다.",
    ],
    concepts: [
      { term: "EOF", definition: "입력 stream에서 더 읽을 data가 없다는 상태입니다.", detail: ["빈 줄과 다릅니다.", "input은 EOFError를 냅니다."] },
      { term: "input adapter", definition: "terminal/stream I/O를 application의 typed read result로 변환하는 경계입니다.", detail: ["테스트에서 주입할 수 있습니다.", "EOF·취소·value를 분류합니다."] },
      { term: "retry budget", definition: "입력 재시도에 허용된 횟수 또는 시간 상한입니다.", detail: ["무한 loop를 막습니다.", "EOF·cancel은 보통 즉시 종료합니다."] },
    ],
    codeExamples: [{
      id: "input-state-machine-injected-adapter",
      title: "value·empty·EOF·cancel을 terminal 없이 검증합니다",
      language: "python",
      filename: "input_state_machine.py",
      purpose: "대화형 상태를 주입 가능한 callable과 stable result tuple로 분류합니다.",
      code: String.raw`def read_once(reader):
    try:
        raw = reader()
    except EOFError:
        return ("eof", None)
    except KeyboardInterrupt:
        return ("cancelled", None)
    if raw == "":
        return ("empty", "")
    return ("value", raw)

def returning(value):
    return lambda: value

def raising(error):
    def reader():
        raise error
    return reader

cases = [
    returning(" 42 "),
    returning(""),
    raising(EOFError()),
    raising(KeyboardInterrupt()),
]
for reader in cases:
    print(read_once(reader))

def collect(reader, attempts):
    errors = 0
    for _ in range(attempts):
        state, raw = read_once(reader)
        if state in {"eof", "cancelled"}:
            return state
        if state == "value" and raw.strip():
            return "accepted:" + raw.strip()
        errors += 1
    return "retry-exhausted:" + str(errors)

values = iter(["", "  ", "Python"])
print(collect(lambda: next(values), 3))
print(collect(returning(""), 2))`,
      walkthrough: [
        { lines: "1-10", explanation: "reader의 EOFError/KeyboardInterrupt와 정상 empty/value를 네 상태로 분류합니다." },
        { lines: "12-24", explanation: "고정 반환·예외 reader를 만들어 terminal 없이 모든 상태를 실행합니다." },
        { lines: "26-38", explanation: "EOF/cancel은 즉시 종료하고 empty에는 bounded retry를 적용하는 collect state machine을 구현합니다." },
        { lines: "40-42", explanation: "세 번째 유효 입력 성공과 retry budget 소진을 exact output으로 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "실제 stdin/terminal 불필요"], command: "python -I -B input_state_machine.py" },
      output: { value: "('value', ' 42 ')\n('empty', '')\n('eof', None)\n('cancelled', None)\naccepted:Python\nretry-exhausted:2", explanation: ["empty string과 EOF는 별도 결과입니다.", "모든 retry path는 유한하게 종료합니다."] },
      experiments: [
        { change: "EOF를 empty로 바꿔 계속 retry합니다.", prediction: "pipe 종료 뒤 영원히 input을 반복할 수 있습니다.", result: "EOF는 terminal state로 유지합니다." },
        { change: "KeyboardInterrupt를 broad Exception으로 잡습니다.", prediction: "KeyboardInterrupt는 Exception이 아니라 BaseException 계열이라 잡히지 않습니다.", result: "취소를 명시적으로 처리하거나 상위로 전파합니다." },
        { change: "password를 input으로 읽습니다.", prediction: "terminal에 그대로 echo될 수 있습니다.", result: "getpass와 non-interactive secret channel을 사용합니다." },
      ],
      sourceRefs: ["py-input-builtin", "py-eoferror", "py-keyboardinterrupt", "py-getpass"],
    }],
    diagnostics: [
      { symptom: "파일/pipe 입력이 끝난 뒤 프로그램이 계속 오류를 출력한다.", likelyCause: "EOFError를 일반 invalid value로 처리해 무한 재시도합니다.", checks: ["stdin source가 terminal인지 pipe/file인지 봅니다.", "EOF handler와 retry counter를 확인합니다."], fix: "EOF를 명시적 terminal result로 반환하고 cleanup 후 종료합니다.", prevention: "empty line과 EOF를 별도 integration tests로 둡니다." },
      { symptom: "Ctrl+C를 눌러도 프로그램이 다시 prompt를 띄운다.", likelyCause: "취소를 validation error와 같은 retry branch로 합쳤습니다.", checks: ["KeyboardInterrupt handler와 broad BaseException catch를 봅니다.", "cleanup/exit policy를 확인합니다."], fix: "cancelled 상태를 즉시 상위에 전파하거나 명시적 종료로 처리합니다.", prevention: "cancel acceptance test와 bounded retry invariant를 둡니다." },
      { symptom: "자동 테스트가 input 호출에서 멈춘다.", likelyCause: "I/O와 parser/business logic이 한 함수에 hard-code됐습니다.", checks: ["input을 직접 호출하는 깊은 functions를 찾습니다.", "reader injection seam을 봅니다."], fix: "가장 바깥 adapter만 input을 호출하고 내부에는 reader 또는 raw string을 전달합니다.", prevention: "순수 parser unit tests와 adapter integration tests를 분리합니다." },
    ],
  },
  {
    id: "conversion-exception-domain-validation",
    title: "문법 parsing·type misuse·domain range 오류를 exception taxonomy로 분리합니다",
    lead: "int/Decimal 변환 실패를 모두 '숫자가 아님'으로 뭉개지 않고 presence, Unicode/ASCII 문법, ValueError, TypeError와 범위 규칙을 단계별 error code로 만듭니다.",
    explanations: [
      "int(text, 10)는 leading/trailing whitespace와 sign, Unicode decimal digits 일부를 허용합니다. 제품이 ASCII score만 받는다면 parser 호출 전 isascii와 explicit grammar를 검증합니다.",
      "ValueError는 올바른 input type이지만 값 문법이 맞지 않는 사용자 오류 후보입니다. TypeError는 None/list 같은 잘못된 객체 type을 넘긴 programmer/integration 오류일 수 있어 같은 메시지로 숨기지 않습니다.",
      "bool은 int subclass라 isinstance(True, int)가 True입니다. 외부 JSON bool이 score로 들어오지 않게 raw adapter type과 parsed domain type을 strict하게 검사합니다.",
      "float는 NaN/Infinity와 binary rounding을 포함합니다. 성적 평균에 finite check가 필요하고 돈·정확한 decimal 입력에는 decimal.Decimal과 scale/rounding policy가 적합합니다.",
      "parse 성공 뒤에도 0..100 range, 단위, cross-field invariant를 검증해야 합니다. 오류 응답에는 raw secret/value 전체 대신 field와 stable code를 둡니다.",
    ],
    concepts: [
      { term: "syntax validation", definition: "문자열이 parser가 허용한 표기 규칙에 맞는지 확인하는 단계입니다.", detail: ["typed value conversion 전입니다.", "domain range와 다릅니다."] },
      { term: "domain validation", definition: "변환된 값이 업무 범위·단위·관계 조건을 만족하는지 확인하는 단계입니다.", detail: ["parse 성공을 전제로 합니다.", "0..100 같은 invariant입니다."] },
      { term: "exception taxonomy", definition: "사용자 값 오류, integration type 오류, 취소와 system failure를 의미별로 분류하는 체계입니다.", detail: ["retry/alert를 결정합니다.", "broad except를 피합니다."] },
    ],
    codeExamples: [{
      id: "score-parser-error-taxonomy",
      title: "ASCII 문법·ValueError·TypeError·range를 stable result로 분리합니다",
      language: "python",
      filename: "score_parser_taxonomy.py",
      purpose: "외부 raw object를 score로 바꾸는 각 실패 경계를 예외 message에 의존하지 않고 검증합니다.",
      code: String.raw`def parse_score(raw):
    if type(raw) is not str:
        return (False, "type")
    text = raw.strip()
    if not text:
        return (False, "required")
    unsigned = text[1:] if text[:1] in {"+", "-"} else text
    if not unsigned or not unsigned.isascii() or not unsigned.isdecimal():
        return (False, "ascii-integer")
    try:
        value = int(text, 10)
    except ValueError:
        return (False, "integer")
    if not 0 <= value <= 100:
        return (False, "range")
    return (True, value)

cases = [" 90 ", "+7", "-1", "101", "９０", "9.5", "", None, True]
for raw in cases:
    print(repr(raw), "->", parse_score(raw))

def unsafe_convert(raw):
    try:
        return (True, int(raw))
    except ValueError:
        return (False, "value")
    except TypeError:
        return (False, "type")

print("exception_types:", unsafe_convert("x"), unsafe_convert(None))`,
      walkthrough: [
        { lines: "1-15", explanation: "strict str/presence/ASCII decimal grammar, int conversion과 domain range를 순서대로 검사합니다." },
        { lines: "17-19", explanation: "정상·sign·range·Unicode digits·decimal·empty·wrong type cases를 table로 실행합니다." },
        { lines: "21-30", explanation: "builtin int가 내는 ValueError와 TypeError를 별도 stable code로 매핑합니다." },
      ],
      run: { environment: ["Python 3.13+", "locale/network 불필요"], command: "python -I -B score_parser_taxonomy.py" },
      output: { value: "' 90 ' -> (True, 90)\n'+7' -> (True, 7)\n'-1' -> (False, 'range')\n'101' -> (False, 'range')\n'９０' -> (False, 'ascii-integer')\n'9.5' -> (False, 'ascii-integer')\n'' -> (False, 'required')\nNone -> (False, 'type')\nTrue -> (False, 'type')\nexception_types: (False, 'value') (False, 'type')", explanation: ["Unicode decimal digits를 명시적 ASCII policy로 거부합니다.", "TypeError와 ValueError를 다른 integration/user categories로 유지합니다."] },
      experiments: [
        { change: "isascii 검사를 제거합니다.", prediction: "int('９０')가90으로 성공할 수 있습니다.", result: "parser의 넓은 Unicode 문법과 제품 grammar를 구분합니다." },
        { change: "except Exception 하나로 합칩니다.", prediction: "programmer type bug와 사용자 문법 오류가 같은 retry 메시지가 됩니다.", result: "taxonomy와 observability가 사라집니다." },
        { change: "float('nan')을 범위 검사 없이 받습니다.", prediction: "parse는 성공하지만 비교/집계 의미가 깨질 수 있습니다.", result: "math.isfinite와 domain policy가 필요합니다." },
      ],
      sourceRefs: ["py-int-builtin", "py-exceptions", "py-decimal", "py-float-info"],
    }],
    diagnostics: [
      { symptom: "전각９０이 어떤 화면에서는 통과하고 다른 validator에서는 거부된다.", likelyCause: "Unicode digit parser와 ASCII-only UI 정책이 정렬되지 않았습니다.", checks: ["repr/code points와 isascii/isdecimal을 봅니다.", "client/server grammar를 비교합니다."], fix: "허용 문자 grammar를 명시하고 모든 boundary에서 같은 parser를 사용합니다.", prevention: "ASCII/Unicode digits와 normalization cases를 contract test합니다." },
      { symptom: "None 입력이 사용자 숫자 오류로 반복 재시도된다.", likelyCause: "TypeError를 ValueError와 같은 사용자 branch로 합쳤습니다.", checks: ["raw adapter type과 exception class를 확인합니다.", "integration schema를 봅니다."], fix: "wrong object type은 integration/programmer error로 분류하고 사용자 retry와 분리합니다.", prevention: "type contract와 telemetry error code를 둡니다." },
      { symptom: "숫자 parsing은 성공했는데 성적101이 저장된다.", likelyCause: "syntax conversion 뒤 domain range 검증이 없습니다.", checks: ["parse와 business validation 단계가 분리됐는지 봅니다.", "DB constraint를 확인합니다."], fix: "0..100 invariant를 service와 persistence boundary에도 적용합니다.", prevention: "boundary-1/boundary/boundary+1 tests와 DB constraint를 둡니다." },
    ],
  },
  {
    id: "locale-explicit-number-grammar-formatting",
    title: "locale 의존 parsing과 표시 formatting을 explicit grammar로 분리합니다",
    lead: "쉼표와 점의 의미는 locale에 따라 decimal 또는 grouping separator가 될 수 있으므로 global locale에 기대지 않고 source별 형식 계약을 명시합니다.",
    explanations: [
      "'1,234'는 en-style에서는 천이백삼십사, 일부 locale에서는 소수1.234일 수 있습니다. 문자열만 보고 사용자의 의도를 유일하게 복원할 수 없습니다.",
      "locale.setlocale은 process-global 상태에 영향을 주며 library/thread에서 임의 변경하면 다른 parsing/formatting과 race를 만들 수 있습니다. 애플리케이션 core에는 locale-neutral typed value를 전달합니다.",
      "외부 machine protocol은 decimal point와 no-grouping 같은 locale-neutral grammar를 사용하는 편이 안전합니다. 인간 UI adapter는 선택된 locale의 separator/grouping을 검증해 canonical Decimal로 변환합니다.",
      "group separator를 단순 replace하면 잘못된 '12,34'도1234로 통과합니다. 첫 group1~3 digits, 이후 groups3 digits와 decimal part digits를 검사합니다.",
      "format(value, ',.2f') 같은 출력 정책은 parsing과 별도입니다. currency symbol, rounding, negative와 locale display는 UI/i18n layer가 소유합니다.",
    ],
    concepts: [
      { term: "locale-neutral core", definition: "locale-specific text를 boundary에서 typed value로 바꾼 뒤 내부 계산은 locale에 의존하지 않는 설계입니다.", detail: ["Decimal/int를 전달합니다.", "표시는 adapter가 담당합니다."] },
      { term: "grouping grammar", definition: "천 단위 separator 위치와 각 digit group 길이를 정의한 문법입니다.", detail: ["단순 replace보다 엄격합니다.", "locale별 규칙일 수 있습니다."] },
    ],
    codeExamples: [{
      id: "explicit-locale-decimal-parser",
      title: "명시적 decimal/group separators로 금액을 canonical Decimal로 바꿉니다",
      language: "python",
      filename: "explicit_locale_number.py",
      purpose: "global locale 없이 en/de-style 형식과 잘못된 grouping을 결정적으로 검증합니다.",
      code: String.raw`from decimal import Decimal, InvalidOperation

def parse_number(raw, *, group, decimal):
    text = raw.strip()
    if not text or group == decimal or text.count(decimal) > 1:
        return (False, "format")
    integer, separator, fraction = text.partition(decimal)
    sign = ""
    if integer[:1] in {"+", "-"}:
        sign, integer = integer[0], integer[1:]
    groups = integer.split(group) if group else [integer]
    if not groups or not 1 <= len(groups[0]) <= 3:
        return (False, "grouping")
    if len(groups) > 1 and any(len(part) != 3 for part in groups[1:]):
        return (False, "grouping")
    if any(not part.isascii() or not part.isdecimal() for part in groups):
        return (False, "digits")
    if separator and (not fraction or not fraction.isascii() or not fraction.isdecimal()):
        return (False, "fraction")
    canonical = sign + "".join(groups) + ("." + fraction if separator else "")
    try:
        return (True, Decimal(canonical))
    except InvalidOperation:
        return (False, "decimal")

print("en:", parse_number("1,234.50", group=",", decimal="."))
print("de:", parse_number("1.234,50", group=".", decimal=","))
print("bad_group:", parse_number("12,34.50", group=",", decimal="."))
print("ambiguous_en:", parse_number("1,234", group=",", decimal="."))
print("ambiguous_de:", parse_number("1,234", group=".", decimal=","))
value = Decimal("1234.5")
print("display_en:", format(value, ",.2f"))`,
      walkthrough: [
        { lines: "1-9", explanation: "빈 값, separator 설정과 sign/decimal partition을 명시적으로 처리합니다." },
        { lines: "10-19", explanation: "첫/후속 grouping 길이와 ASCII digits/fraction grammar를 검증합니다." },
        { lines: "20-24", explanation: "canonical dot-decimal 문자열을 Decimal로 변환하고 InvalidOperation을 stable code로 분류합니다." },
        { lines: "26-32", explanation: "en/de 형식, 잘못된 group와 같은 raw text의 locale별 ambiguity, 별도 display formatting을 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "system locale 변경 없음"], command: "python -I -B explicit_locale_number.py" },
      output: { value: "en: (True, Decimal('1234.50'))\nde: (True, Decimal('1234.50'))\nbad_group: (False, 'grouping')\nambiguous_en: (True, Decimal('1234'))\nambiguous_de: (True, Decimal('1.234'))\ndisplay_en: 1,234.50", explanation: ["같은 '1,234'가 grammar 선택에 따라 다른 typed value가 됩니다.", "core Decimal은 locale-neutral합니다."] },
      experiments: [
        { change: "group separator를 단순 replace합니다.", prediction: "12,34 같은 invalid grouping도 통과합니다.", result: "위치 grammar 검증이 필요합니다." },
        { change: "library 안에서 setlocale을 바꿉니다.", prediction: "다른 threads/components의 parsing/formatting 결과가 영향을 받을 수 있습니다.", result: "locale state ownership을 process edge로 제한합니다." },
        { change: "float로 돈을 저장합니다.", prediction: "일부 decimal fractions가 binary로 정확히 표현되지 않습니다.", result: "Decimal과 rounding/scale policy를 사용합니다." },
      ],
      sourceRefs: ["py-locale-module", "py-decimal", "py-format-spec", "py-text-io"],
    }],
    diagnostics: [
      { symptom: "1,234가 사용자마다1234 또는1.234로 저장된다.", likelyCause: "입력 locale/grammar를 명시하지 않고 separator를 추측했습니다.", checks: ["입력 source의 locale metadata와 separator policy를 확인합니다.", "raw text와 canonical value를 분리해 봅니다."], fix: "UI에서 locale을 명시하고 해당 grammar로 검증하거나 machine-neutral format을 요구합니다.", prevention: "locale별 ambiguous/boundary examples를 contract test합니다." },
      { symptom: "동시 요청의 숫자 formatting 언어가 간헐적으로 바뀐다.", likelyCause: "request마다 process-global locale.setlocale을 변경했습니다.", checks: ["setlocale 호출과 thread/request trace를 찾습니다.", "formatter ownership을 봅니다."], fix: "global locale 변경을 피하고 locale-aware formatter 또는 explicit grammar/format spec을 adapter에 사용합니다.", prevention: "parallel locale requests와 no-global-mutation architecture rule을 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "빈 줄과 EOF는 같은가요?", answer: "아닙니다. 빈 줄은 정상적으로 읽은 empty str이고 EOF는 더 읽을 data가 없어 input이 EOFError를 내는 상태입니다." },
  { question: "Ctrl+C는 보통 어떤 예외인가요?", answer: "KeyboardInterrupt이며 Exception이 아니라 BaseException 계열입니다." },
  { question: "재시도 budget이 필요한 이유는 무엇인가요?", answer: "영원한 invalid input·EOF loop와 자원 점유를 막고 종료 조건을 명확히 하기 위해서입니다." },
  { question: "ValueError와 TypeError를 왜 구분하나요?", answer: "값 문법 오류와 잘못된 객체 type/integration bug의 책임·retry 정책이 다르기 때문입니다." },
  { question: "int가 허용하는 Unicode digits와 제품 ASCII 정책은 같나요?", answer: "아닙니다. 제품 grammar가 더 좁으면 isascii 등으로 명시적으로 제한해야 합니다." },
  { question: "parse 성공만으로 domain validation이 끝나나요?", answer: "아닙니다. 범위·단위·cross-field invariant를 추가로 확인해야 합니다." },
  { question: "locale.setlocale을 request마다 바꾸면 왜 위험한가요?", answer: "process-global state라 동시 components의 parsing/formatting에 영향을 줄 수 있기 때문입니다." },
  { question: "돈 입력에 Decimal을 검토하는 이유는 무엇인가요?", answer: "decimal fractions와 rounding/scale 정책을 binary float보다 명시적으로 다룰 수 있기 때문입니다." },
);
session.completionChecklist.push(
  "empty input과 EOF를 별도 상태로 처리한다.",
  "KeyboardInterrupt 취소를 validation retry와 분리한다.",
  "input adapter와 순수 parser를 분리한다.",
  "모든 retry loop에 횟수 또는 deadline을 둔다.",
  "ValueError·TypeError·domain range 오류를 구분한다.",
  "ASCII/Unicode 숫자 grammar를 명시한다.",
  "global locale 변경 없이 explicit parser를 사용한다.",
  "parse와 locale별 display formatting을 분리한다.",
);
session.sources.push(
  { id: "py-input-builtin", repository: "Python 3 Library Reference", path: "input", publicUrl: "https://docs.python.org/3/library/functions.html#input", usedFor: ["prompt/read/EOF contract"], evidence: "input builtin의 공식 계약입니다." },
  { id: "py-eoferror", repository: "Python 3 Library Reference", path: "EOFError", publicUrl: "https://docs.python.org/3/library/exceptions.html#EOFError", usedFor: ["stream end classification"], evidence: "EOFError의 공식 exception 정의입니다." },
  { id: "py-keyboardinterrupt", repository: "Python 3 Library Reference", path: "KeyboardInterrupt", publicUrl: "https://docs.python.org/3/library/exceptions.html#KeyboardInterrupt", usedFor: ["interactive cancellation"], evidence: "KeyboardInterrupt와 BaseException 계층의 공식 근거입니다." },
  { id: "py-getpass", repository: "Python 3 Library Reference", path: "getpass", publicUrl: "https://docs.python.org/3/library/getpass.html", usedFor: ["non-echo secret input"], evidence: "secret prompt adapter의 공식 API입니다." },
  { id: "py-int-builtin", repository: "Python 3 Library Reference", path: "int", publicUrl: "https://docs.python.org/3/library/functions.html#int", usedFor: ["integer parsing grammar"], evidence: "int conversion의 공식 계약입니다." },
  { id: "py-exceptions", repository: "Python 3 Library Reference", path: "Built-in Exceptions", publicUrl: "https://docs.python.org/3/library/exceptions.html", usedFor: ["ValueError/TypeError taxonomy"], evidence: "builtin exception hierarchy의 공식 reference입니다." },
  { id: "py-decimal", repository: "Python 3 Library Reference", path: "decimal", publicUrl: "https://docs.python.org/3/library/decimal.html", usedFor: ["exact decimal parsing", "InvalidOperation"], evidence: "Decimal arithmetic의 공식 API입니다." },
  { id: "py-float-info", repository: "Python 3 Tutorial", path: "Floating-Point Arithmetic", publicUrl: "https://docs.python.org/3/tutorial/floatingpoint.html", usedFor: ["binary float limits"], evidence: "Python float representation의 공식 설명입니다." },
  { id: "py-locale-module", repository: "Python 3 Library Reference", path: "locale", publicUrl: "https://docs.python.org/3/library/locale.html", usedFor: ["process-wide locale caveat", "locale parsing context"], evidence: "locale module의 공식 계약과 주의사항입니다." },
  { id: "py-format-spec", repository: "Python 3 Language Reference", path: "Format Specification Mini-Language", publicUrl: "https://docs.python.org/3/library/string.html#format-specification-mini-language", usedFor: ["display grouping/precision"], evidence: "숫자 표시 formatting의 공식 문법입니다." },
  { id: "py-text-io", repository: "Python 3 Library Reference", path: "Text I/O", publicUrl: "https://docs.python.org/3/library/io.html#text-i-o", usedFor: ["text stream boundary"], evidence: "stdin을 포함한 text stream model의 공식 근거입니다." },
);

export default session;
