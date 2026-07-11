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
          output: { value: "이름 : 둘리\n국어점수 : 90\n영어점수 : 80\n수학점수 : 70\nname='둘리'\ntotal=240\naverage=80.00\nstr int", explanation: ["대화형 터미널에서는 입력한 글자가 prompt 뒤에 보입니다. 파이프 실행은 prompt들이 한 줄처럼 이어질 수 있습니다.", "평균은 float 80.0이지만 .2f 표시가 80.00 문자열 모양을 만듭니다.", "kor_text와 kor 타입 출력이 입력과 내부 계산 값 경계를 증명합니다."] },
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
            { lines: "13", explanation: "두 경계를 모두 통과한 int만 내부 검증 값으로 사용합니다." },
          ],
          run: { environment: ["Python 3.11 이상", "validated_score.py를 저장"], command: "python validated_score.py", input: "101" },
          output: { value: "점수(0~100) : 101\n오류: 점수는 0~100이어야 합니다.", explanation: ["101은 정수 파싱에 성공하므로 ‘정수를 입력’ 오류가 아닙니다.", "입력을 abc로 바꾸면 ValueError 경로의 문법 오류가 출력됩니다.", "입력 100은 포함 경계라 검증 성공입니다."] },
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

export default session;
