import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-036"],
  slug: "python-036-raise-custom-exceptions-safe-conversion",
  courseId: "python",
  moduleId: "04-reliability-tooling",
  order: 36,
  title: "raise·사용자 정의 예외·안전한 변환",
  subtitle: "잘못된 상태를 조용히 통과시키지 않고 구조화된 domain 오류로 전달하며, 원인·부분 성공·복구 정책을 호출자가 선택하게 합니다.",
  level: "중급",
  estimatedMinutes: 150,
  coreQuestion: "실패를 단순 메시지나 None으로 잃지 않고 호출자가 부족액·오류 위치·원인을 구조적으로 읽어 복구할 수 있는 예외 API를 어떻게 설계할까요?",
  summary: "raise로 TypeError·ValueError를 명시하고 bare raise로 traceback을 보존하는 원본을 재현합니다. InsufficientBalanceError의 balance·amount 속성과 43,000원 부족액을 구조화하고 domain exception hierarchy·error code·immutability를 다룹니다. raise from chaining, 안전한 변환에서 default 값과 오류 정보 손실, batch partial result·ExceptionGroup, API/로그 민감정보와 transaction invariant까지 확장합니다.",
  objectives: [
    "입력 타입·값·상태 invariant 위반을 적절한 built-in 또는 domain exception으로 raise할 수 있다.",
    "raise와 bare raise의 차이를 설명하고 현재 traceback을 보존해 재전파할 수 있다.",
    "Exception을 상속한 사용자 정의 예외에 구조화 속성·안전 메시지·stable error code를 설계할 수 있다.",
    "raise HighLevelError from cause로 exception chain을 만들고 from None의 제한적 용도를 설명할 수 있다.",
    "안전 변환에서 기본값이 실제 정상값과 오류를 섞는지 판단하고 Result·오류 목록·예외 중 적합한 계약을 선택할 수 있다.",
    "batch 처리에서 fail-fast·오류 수집·부분 성공·transaction rollback 정책을 명시할 수 있다.",
    "domain 예외를 HTTP·CLI·worker boundary에서 변환하면서 민감정보와 원인을 분리할 수 있다.",
  ],
  prerequisites: [
    { title: "예외 분류·else·finally", reason: "구체 handler·전파·cleanup 흐름 위에 명시 raise와 domain hierarchy를 설계합니다.", sessionSlug: "python-035-exception-classification-else-finally" },
    { title: "클래스·객체·생성자", reason: "Exception subclass 생성자와 구조화 instance 속성을 만듭니다.", sessionSlug: "python-028-class-object-constructor" },
  ],
  keywords: ["Python", "raise", "re-raise", "custom exception", "exception chaining", "raise from", "domain error", "safe conversion", "partial failure", "ExceptionGroup"],
  chapters: [
    {
      id: "raising-contract-violations",
      title: "raise는 현재 함수가 계약을 만족하는 정상 결과를 만들 수 없음을 호출자에게 알립니다",
      lead: "잘못된 age를 print하고 계속 저장하기보다 TypeError·ValueError를 발생시키면 불완전 상태가 다음 계층으로 퍼지지 않습니다.",
      explanations: [
        "원본 set_age는 정수가 아니면 TypeError, 음수면 ValueError를 raise합니다. 타입이 맞지만 허용 값 범위가 아니면 ValueError, 연산을 지원하지 않는 타입이면 TypeError라는 built-in 의미를 활용합니다. bool이 int의 subclass라는 경계는 domain에서 별도 검사합니다.",
        "raise Exception('오류') 하나로 모든 실패를 표현하면 호출자가 복구 방법을 구분하기 어렵습니다. 표준 의미에 맞는 built-in class 또는 작은 domain hierarchy를 사용합니다. class 수를 메시지 하나마다 늘리지 말고 복구 행동이 달라지는 안정 범위에서 나눕니다.",
        "validation은 state 변경 전에 수행합니다. 잔액을 먼저 빼고 음수가 된 뒤 예외를 내면 caller가 catch해도 객체 invariant가 깨져 있습니다. 모든 입력과 권한을 검증한 뒤 state를 commit하거나 transaction rollback을 사용합니다.",
        "assert는 내부 불변 가정 확인용이며 python -O에서 제거될 수 있어 사용자 입력 validation과 business rule에 사용하지 않습니다. 계약 위반은 명시 raise합니다.",
      ],
      concepts: [
        { term: "explicit raise", definition: "현재 위치에서 지정 exception 객체·class를 의도적으로 발생시켜 정상 제어 흐름을 중단하는 문장입니다.", detail: ["호출 stack의 handler까지 전파됩니다.", "raise 전 state invariant를 보존합니다."] },
        { term: "fail fast", definition: "잘못된 입력·상태를 발견한 경계에서 즉시 명확한 실패로 중단해 오염된 결과가 멀리 퍼지지 않게 하는 원칙입니다.", detail: ["모든 batch를 첫 오류에 중단한다는 뜻과는 구분합니다.", "context와 복구 주체를 함께 고려합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "잘못된 값이 들어와도 함수가 print만 하고 객체·DB에 저장되어 나중에 실패한다.", likelyCause: "validation 실패를 제어 흐름과 반환 계약으로 전달하지 않고 로그 문구로만 처리했습니다.", checks: ["validation 뒤에도 state mutation이 진행되는지 봅니다.", "호출자가 실패 여부를 알 수 있는지 확인합니다.", "assert를 외부 입력 검사에 사용했는지 찾습니다."], fix: "state 변경 전에 적절한 exception을 raise하고 application boundary가 사용자 응답으로 변환합니다.", prevention: "invalid input에서 state가 변하지 않는 atomicity test를 둡니다." },
      ],
    },
    {
      id: "structured-custom-exceptions",
      title: "사용자 정의 예외는 메시지보다 복구에 필요한 구조화 속성과 의미 있는 계층을 제공합니다",
      lead: "InsufficientBalanceError 하나로 caller는 문자열을 parse하지 않고 balance·amount·shortfall을 읽을 수 있습니다.",
      explanations: [
        "원본 custom exception은 Exception을 상속하고 super().__init__(message)로 str(error)에 표시할 문구를 설정한 뒤 balance와 amount를 보존합니다. caller는 e.amount-e.balance로 부족액 43,000원을 계산합니다.",
        "예외 class 이름은 발생 원인보다 domain 상황을 설명합니다. BankError base 아래 InsufficientBalanceError·AccountFrozenError처럼 caller가 전체 은행 오류 또는 구체 복구 행동으로 잡을 수 있습니다. hierarchy가 너무 깊으면 의미가 흐려집니다.",
        "stable error_code를 속성으로 둘 수 있지만 class 이름·HTTP status·사용자 번역 문구와 분리합니다. exception은 domain data를 가지고 presentation boundary가 locale에 맞는 메시지를 선택합니다.",
        "예외 객체에 전체 account·request·token을 저장하면 traceback·log·queue serialization에서 민감정보가 노출될 수 있습니다. 필요한 숫자·safe ID·field path만 보존하고 원문 secret은 제외합니다.",
      ],
      concepts: [
        { term: "domain exception", definition: "애플리케이션 domain에서 정상 결과를 만들 수 없는 의미 있는 상황을 나타내는 Exception subclass입니다.", detail: ["복구 정책에 필요한 구조화 field를 가집니다.", "UI·transport 메시지와 분리합니다."] },
        { term: "error code", definition: "client·metric·translation이 exception 문구와 독립적으로 사용할 안정적인 기계 식별자입니다.", detail: ["문자열 message parsing을 피합니다.", "version·문서·중복 정책을 관리합니다."] },
      ],
      codeExamples: [
        {
          id: "structured-balance-error",
          title: "잔액 invariant와 구조화된 부족액",
          language: "python",
          filename: "account_errors.py",
          purpose: "정상 출금 뒤 실패 출금이 잔액을 바꾸지 않고 구조화 속성으로 43,000원 부족을 전달하는지 확인합니다.",
          code: "class AccountError(Exception):\n    pass\n\nclass InsufficientBalanceError(AccountError):\n    code = 'INSUFFICIENT_BALANCE'\n\n    def __init__(self, *, balance, amount):\n        self.balance = balance\n        self.amount = amount\n        self.shortfall = amount - balance\n        super().__init__(f'잔액 {balance:,}원보다 요청 {amount:,}원이 큽니다')\n\nclass Account:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def withdraw(self, amount):\n        if type(amount) is not int or amount <= 0:\n            raise ValueError('amount must be a positive integer')\n        if amount > self.balance:\n            raise InsufficientBalanceError(balance=self.balance, amount=amount)\n        self.balance -= amount\n        return self.balance\n\naccount = Account('둘리', 10_000)\nprint(f'after-success={account.withdraw(3_000):,}')\ntry:\n    account.withdraw(50_000)\nexcept InsufficientBalanceError as error:\n    print(f'{error.code}: shortfall={error.shortfall:,}')\n    print(str(error))\nprint(f'after-failure={account.balance:,}')",
          walkthrough: [
            { lines: "1-11", explanation: "domain base와 구체 exception에 stable code·balance·amount·shortfall·safe message를 넣습니다." },
            { lines: "13-25", explanation: "Account는 amount type·범위와 잔액을 모두 검증한 뒤에만 balance를 변경합니다." },
            { lines: "27", explanation: "정상 3,000원 출금으로 7,000원이 됩니다." },
            { lines: "28-32", explanation: "50,000원 요청은 structured exception으로 code와 43,000원 부족액을 제공합니다." },
            { lines: "33", explanation: "실패 뒤 balance가 여전히 7,000원인지 invariant를 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "account_errors.py로 저장"], command: "python account_errors.py" },
          output: { value: "after-success=7,000\nINSUFFICIENT_BALANCE: shortfall=43,000\n잔액 7,000원보다 요청 50,000원이 큽니다\nafter-failure=7,000", explanation: ["원본과 같은 43,000원 부족액이 문자열 parsing 없이 속성에서 계산됩니다.", "실패 exception이 code와 사용자 표시 후보 문구를 모두 제공하지만 transport mapping은 외부 책임입니다.", "검증 후 mutation 순서로 실패가 잔액을 바꾸지 않습니다."] },
          experiments: [
            { change: "self.balance -= amount를 잔액 검사 앞으로 옮깁니다.", prediction: "예외를 잡아도 balance가 -43,000으로 깨질 수 있습니다.", result: "raise 자체가 rollback을 제공하지 않으므로 검증·transaction 순서가 중요합니다." },
            { change: "except AccountError로 잡습니다.", prediction: "현재 InsufficientBalanceError도 base handler가 잡지만 구체 shortfall 속성은 모든 AccountError에 보장되지 않습니다.", result: "잡는 계층에 맞는 공통 구조와 복구 정책을 사용합니다." },
          ],
          sourceRefs: ["py-custom-exception-source", "python-exception-doc"],
        },
      ],
      diagnostics: [
        { symptom: "호출자가 str(error)에서 숫자·상태를 정규식으로 다시 추출한다.", likelyCause: "custom exception이 구조화 field 없이 표시 메시지만 제공합니다.", checks: ["handler의 message parsing을 검색합니다.", "복구에 필요한 balance·field·retry 정보 목록을 만듭니다.", "민감정보가 exception에 과도하게 담겼는지 확인합니다."], fix: "필요한 안전 field와 stable code를 exception 속성으로 제공하고 message는 사람 표시용으로 분리합니다.", prevention: "구조화 속성 contract test와 localization 변경 test를 둡니다." },
      ],
    },
    {
      id: "reraising-traceback",
      title: "bare raise는 현재 처리 중인 같은 예외와 원래 traceback을 그대로 재전파합니다",
      lead: "catch한 뒤 관찰·부분 정리만 하고 복구하지 못하면 raise만 써서 상위 경계가 최종 정책을 결정하게 합니다.",
      explanations: [
        "원본 parse_score는 ValueError를 잡아 변환 실패를 기록한 뒤 bare raise합니다. 상위 handler는 원래 int 변환 traceback과 exception 객체를 받습니다. raise error로 다시 던지면 traceback의 현재 raise 위치가 추가·변경되어 root 위치 해석이 달라질 수 있습니다.",
        "bare raise는 active except block 안에서만 의미가 있습니다. 처리 중 예외가 없는 곳에서 쓰면 RuntimeError입니다. callback에 나중 재전파하려면 exception 객체와 traceback을 명시적으로 보존해야 하지만 frame·민감정보 수명을 고려합니다.",
        "같은 예외를 여러 계층에서 전부 logger.exception으로 기록하면 duplicate alert와 noise가 생깁니다. 하위 계층은 context field를 추가하거나 metric만 남기고 실제 full traceback logging은 책임 boundary 한 곳에서 수행합니다.",
        "재전파하기 전에 state를 부분 변경했다면 rollback·compensation이 필요합니다. logging 후 raise가 transaction atomicity를 자동 복구하지 않습니다.",
      ],
      concepts: [
        { term: "re-raise", definition: "현재 except가 잡은 예외를 복구하지 않고 같은 실패로 상위 호출자에게 다시 전파하는 동작입니다.", detail: ["bare raise가 원래 traceback을 보존합니다.", "관찰·정리 뒤 상위 정책에 맡길 때 사용합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "재전파한 traceback이 wrapper raise 줄만 강조되고 최초 실패 위치가 혼란스럽다.", likelyCause: "bare raise 대신 raise error를 사용하거나 새 예외를 cause 없이 만들었습니다.", checks: ["handler의 raise 형태를 확인합니다.", "__cause__·__context__와 traceback chain을 봅니다.", "원래 exception type을 불필요하게 바꿨는지 확인합니다."], fix: "같은 오류면 bare raise, abstraction 변환이면 raise NewError(...) from error를 사용합니다.", prevention: "traceback chain과 cause를 assertion하는 실패 test를 둡니다." },
      ],
    },
    {
      id: "exception-chaining",
      title: "raise from으로 낮은 계층 원인과 높은 계층 의미를 동시에 보존합니다",
      lead: "JSONDecodeError를 ConfigLoadError로 바꾸더라도 어떤 파일·어떤 parse 원인이었는지 chain으로 연결해야 진단할 수 있습니다.",
      explanations: [
        "except LowLevelError as error: raise DomainError('...') from error는 새 exception의 __cause__를 명시합니다. traceback은 direct cause를 구분해 보여 줍니다. caller는 DomainError로 abstraction을 유지하고 내부 관찰성은 원래 cause를 추적합니다.",
        "from None은 자동 context 표시를 숨겨 사용자-facing trace를 단순화할 수 있지만 원인을 영구 삭제하는 수단으로 남용하지 않습니다. 내부 log·metric에는 root cause를 별도로 보존하고 민감정보가 cause에 있는지도 검토합니다.",
        "OSError를 모두 StorageError로 바꾸면 FileNotFound·Permission·disk full의 복구 정책이 사라질 수 있습니다. domain hierarchy나 cause 검사로 중요한 차이를 유지합니다.",
        "exception message에 전체 path·SQL·payload를 붙이지 말고 safe identifier와 operation을 넣습니다. cause traceback은 접근 제어된 내부 channel에서만 노출합니다.",
      ],
      concepts: [
        { term: "exception chaining", definition: "높은 수준 exception과 발생 원인이 된 낮은 수준 exception을 __cause__ 또는 __context__로 연결하는 기능입니다.", detail: ["raise ... from ...로 명시 cause를 만듭니다.", "abstraction과 root-cause 진단을 함께 유지합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "domain 오류만 보이고 실제 파일·parse·network 원인을 알 수 없다.", likelyCause: "handler가 새 exception을 cause 없이 발생시켰거나 원본을 문자열로만 합쳤습니다.", checks: ["__cause__와 __context__를 확인합니다.", "raise NewError 문에 from error가 있는지 봅니다.", "로그 formatter가 chain을 출력하는지 확인합니다."], fix: "abstraction 변환에는 explicit chaining을 사용하고 원인을 안전한 내부 관찰성에 보존합니다.", prevention: "domain error test에서 cause type·safe message·PII 부재를 검증합니다." },
      ],
    },
    {
      id: "safe-conversion-contracts",
      title: "안전한 변환은 예외를 없애는 것이 아니라 실패 정보를 어떤 형태로 전달할지 정하는 것입니다",
      lead: "to_int(text, default=0)는 편리하지만 실제 입력 0과 변환 실패를 같은 값으로 만들어 data 품질을 숨길 수 있습니다.",
      explanations: [
        "원본 raw ['10','20','삼십','',None,'40']은 default 0을 사용해 [10,20,0,0,0,40]이 됩니다. 합계만 보면 세 실패가 정상 0처럼 포함됩니다. default가 domain에서 명확한 대체값이고 오류 count를 별도 수집할 때만 안전합니다.",
        "Optional[int] 반환은 None으로 실패를 구분하지만 None 자체가 유효 입력 의미일 수 있습니다. Result 구조(value,error), tuple(success,value), custom ParseError, batch issue list 중 caller 사용 패턴에 맞게 선택합니다.",
        "except (ValueError,TypeError)는 int 변환에서 예상한 실패지만 MemoryError·KeyboardInterrupt·programmer bug까지 잡지 않습니다. 변환 함수 안 다른 code를 넓게 감싸지 않습니다.",
        "coercion 정책은 공백·부호·소수·천 단위·Unicode digit·bool·float truncation을 명시합니다. int(3.9)=3처럼 실행되는 변환이 domain상 허용된다는 뜻은 아닙니다.",
      ],
      concepts: [
        { term: "lossy fallback", definition: "실패를 정상 기본값으로 바꿔 원래 값과 오류 원인을 구분할 수 없게 만드는 변환입니다.", detail: ["data 품질 metric을 함께 유지합니다.", "정상 0·빈 값·실패 의미를 분리합니다."] },
        { term: "Result value", definition: "성공 값 또는 실패 정보를 명시 field·variant로 담아 exception 없이 caller가 둘을 처리하게 하는 반환 구조입니다.", detail: ["batch validation에 유용합니다.", "무시하기 쉬우므로 API convention과 type을 사용합니다."] },
      ],
      codeExamples: [
        {
          id: "batch-parse-results",
          title: "정상 점수와 위치 있는 변환 오류를 함께 보존",
          language: "python",
          filename: "batch_conversion.py",
          purpose: "기본값으로 손실시키지 않고 row·raw·error code를 분리해 평균과 오류 report를 동시에 만듭니다.",
          code: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass ParseIssue:\n    row: int\n    raw: object\n    code: str\n\ndef parse_scores(values):\n    valid = []\n    issues = []\n    for row, raw in enumerate(values, 1):\n        try:\n            score = int(raw)\n        except (TypeError, ValueError):\n            issues.append(ParseIssue(row, raw, 'NOT_INTEGER'))\n            continue\n        if not 0 <= score <= 100:\n            issues.append(ParseIssue(row, raw, 'OUT_OF_RANGE'))\n            continue\n        valid.append(score)\n    return valid, issues\n\nraw = ['85', 'x', None, '101', '0', '90']\nvalid, issues = parse_scores(raw)\nprint(f'valid={valid}')\nprint(f'average={sum(valid) / len(valid):.2f}')\nfor issue in issues:\n    print(f'row={issue.row} raw={issue.raw!r} code={issue.code}')",
          walkthrough: [
            { lines: "1-7", explanation: "불변 ParseIssue가 위치·원문 repr·stable code를 구조화합니다. 실제 민감 원문이면 raw 대신 masked value를 저장합니다." },
            { lines: "9-21", explanation: "각 row에서 변환 실패와 범위 실패를 분리하고 valid list에 정상값만 넣습니다." },
            { lines: "23-28", explanation: "정상 85·0·90의 평균과 세 오류 위치·code를 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "batch_conversion.py로 저장"], command: "python batch_conversion.py" },
          output: { value: "valid=[85, 0, 90]\naverage=58.33\nrow=2 raw='x' code=NOT_INTEGER\nrow=3 raw=None code=NOT_INTEGER\nrow=4 raw='101' code=OUT_OF_RANGE", explanation: ["정상 0은 보존되고 변환 실패 default 0과 섞이지 않습니다.", "원본 ex06의 valid/errors 분리를 row와 error code까지 구조화했습니다.", "caller는 허용 오류 비율·fail 정책을 결정할 수 있습니다."] },
          experiments: [
            { change: "오류에서 valid.append(0)을 추가합니다.", prediction: "평균이 낮아지고 실제 0과 실패 fallback을 구분하기 어려워집니다.", result: "fallback이 통계 의미를 바꾸면 명시 quality policy가 필요합니다." },
            { change: "raw에 True를 추가합니다.", prediction: "int(True)=1로 정상 통과합니다.", result: "bool을 점수로 금지하려면 변환 전 type(raw) is bool 검사를 추가합니다." },
          ],
          sourceRefs: ["py-practical-exception-source", "python-dataclass-doc"],
        },
      ],
      diagnostics: [
        { symptom: "정제 후 0이 많지만 실제 0인지 변환 실패인지 알 수 없다.", likelyCause: "모든 실패를 default=0으로 바꿔 provenance와 error code를 버렸습니다.", checks: ["원본·정제 pair와 오류 count를 비교합니다.", "정상 0의 domain 의미를 확인합니다.", "fallback이 평균·모델 input에 포함되는지 봅니다."], fix: "성공 값과 issue를 별도 구조로 보존하고 fallback 사용 여부를 후속 policy에서 결정합니다.", prevention: "data quality report와 실패율 threshold, 실제 0 fixture를 둡니다." },
      ],
    },
    {
      id: "batch-partial-failure",
      title: "batch 실패는 fail-fast·오류 수집·부분 commit 중 무엇을 보장할지 먼저 정합니다",
      lead: "행별 독립 import와 은행 transfer batch는 같은 오류 수집 전략을 사용할 수 없습니다.",
      explanations: [
        "독립 log 행 정제는 invalid 행을 격리하고 valid 결과를 계속 처리할 수 있습니다. 그러나 계좌 이체 여러 단계는 일부 성공 뒤 나머지 실패가 데이터 무결성을 깨므로 transaction 전체 rollback이나 saga compensation이 필요합니다.",
        "오류를 모두 수집하면 사용자 수정 효율이 높지만 memory·PII가 늘 수 있습니다. 최대 issue 수, sample masking, total error count를 분리합니다. 첫 N개만 저장하고 truncated flag를 둡니다.",
        "Python 3.11 ExceptionGroup은 병렬·동시 작업의 여러 exception을 하나로 보존하고 except*로 type별 처리할 수 있습니다. 단순 validation issue에는 data Result list가 더 읽기 좋을 수 있습니다.",
        "부분 성공 API는 committed IDs와 failed issues를 함께 반환하고 retry가 중복 side effect를 만들지 않도록 idempotency key를 사용합니다. 성공처럼 HTTP 200만 반환하고 일부 실패를 body 깊숙이 숨기지 않습니다.",
      ],
      concepts: [
        { term: "partial failure", definition: "batch·분산 작업 일부는 성공하고 일부는 실패해 하나의 success boolean으로 상태를 표현할 수 없는 상황입니다.", detail: ["원자성·부분 commit·재시도 정책이 필요합니다.", "성공·실패 item 식별자를 보존합니다."] },
        { term: "ExceptionGroup", definition: "여러 독립 exception을 계층적으로 묶어 동시에 전파하고 except*로 type별 처리할 수 있는 Python 3.11+ 기능입니다.", detail: ["병렬 task 실패 보존에 적합합니다.", "validation issue data model과 목적을 비교합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "batch retry 뒤 이미 성공한 항목이 중복 저장·청구된다.", likelyCause: "부분 성공 결과·idempotency를 보존하지 않고 전체 batch를 무조건 재실행했습니다.", checks: ["성공 ID와 실패 ID가 응답·artifact에 있는지 봅니다.", "operation idempotency key·unique constraint를 확인합니다.", "transaction boundary를 추적합니다."], fix: "원자 transaction을 사용하거나 item별 idempotency와 부분 결과를 보존해 실패 항목만 재시도합니다.", prevention: "중간 실패·retry·duplicate delivery fault-injection test를 둡니다." },
      ],
    },
    {
      id: "domain-error-boundaries",
      title: "domain 예외는 transport·UI와 분리하고 boundary에서 안전한 상태 code로 변환합니다",
      lead: "InsufficientBalanceError가 곧 HTTP 400이나 한국어 문구인 것은 아니며 client·권한·운영 정책이 있는 바깥 계층이 매핑합니다.",
      explanations: [
        "HTTP handler는 InsufficientBalanceError를 409 또는 domain-defined status와 safe JSON error code로 변환할 수 있습니다. CLI는 stderr와 nonzero exit code, batch worker는 retry 불가 failure로 기록합니다. 같은 domain 오류가 여러 transport에서 재사용됩니다.",
        "예상 domain 예외는 debug traceback을 사용자에게 노출하지 않지만 unexpected Exception은 내부 error ID와 traceback을 남기고 generic response를 반환합니다. 모든 Exception을 domain 400으로 바꾸면 server bug가 client 탓으로 숨겨집니다.",
        "권한 실패와 존재하지 않음을 구분해 반환하면 resource enumeration 위험이 있을 수 있습니다. 보안 정책상 외부 메시지는 통합하더라도 내부 code와 audit 원인은 보존합니다.",
        "예외 class는 API wire format이 아닙니다. process·language boundary를 넘길 때 versioned error schema로 serialize하고 arbitrary pickle exception을 받지 않습니다.",
      ],
      concepts: [
        { term: "error mapping", definition: "domain exception을 HTTP status·CLI exit·job state·public error schema로 변환하는 application boundary 정책입니다.", detail: ["domain과 presentation을 분리합니다.", "예상 오류와 unexpected bug를 다르게 처리합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "실패 계약을 어떤 형태로 전달할까요?", options: [
          { name: "exception", chooseWhen: "정상 반환을 만들 수 없고 caller가 stack 경계에서 복구·전파할 때", avoidWhen: "대량 행별 validation처럼 실패가 흔한 data 결과일 때", tradeoffs: ["정상 흐름과 분리되고 traceback이 있습니다.", "남용하면 제어 흐름이 복잡합니다.", "구조화 hierarchy가 필요합니다."] },
          { name: "Result/issue data", chooseWhen: "부분 성공·여러 validation 오류를 정상적으로 수집·표시할 때", avoidWhen: "programmer bug·자원 실패를 무시 가능한 값으로 바꿀 때", tradeoffs: ["여러 오류와 위치를 보존합니다.", "caller가 확인을 잊을 수 있습니다.", "type·convention이 필요합니다."] },
          { name: "default/None", chooseWhen: "없음·fallback이 domain에서 명확하고 오류 원인이 중요하지 않을 때", avoidWhen: "정상 0·빈 값과 실패가 구분돼야 할 때", tradeoffs: ["호출이 단순합니다.", "원인·품질을 잃을 수 있습니다.", "Optional contract를 명시합니다."] },
        ] },
      ],
      expertNotes: ["exception class를 public package API로 제공하면 hierarchy·constructor·attributes도 versioned contract이므로 변경 시 compatibility를 검토합니다.", "distributed trace에 exception을 record할 때 stacktrace·message·attributes의 PII와 high-cardinality를 제한하고 stable error.type/code를 사용합니다."],
    },
  ],
  lab: {
    title: "구조화된 주문 검증·결제 오류 pipeline",
    scenario: "문자열 주문 입력을 parse하고 inventory·잔액을 검증해 결제하되 state atomicity와 domain 오류·transport mapping을 분리합니다.",
    setup: ["order_errors.py와 test_order_errors.py를 만듭니다.", "fake inventory·account와 합성 상품만 사용합니다.", "OrderInputError, OutOfStockError, InsufficientBalanceError hierarchy를 설계합니다."],
    steps: ["외부 문자열 수량·금액 parsing 실패를 field path와 safe code가 있는 OrderInputError로 변환하고 cause를 보존합니다.", "domain 예외에 product ID·available·requested 또는 balance·amount처럼 복구에 필요한 안전 field를 넣습니다.", "모든 validation을 inventory·balance 변경 전에 완료합니다.", "결제와 재고 차감을 transaction처럼 commit하고 중간 실패 rollback을 test합니다.", "batch 주문에는 fail-fast와 issue 수집 정책을 구분합니다.", "HTTP/CLI mapper가 같은 domain 예외를 다른 public 표현으로 바꾸게 합니다.", "unexpected bug는 domain 400으로 숨기지 않고 traceback과 error ID를 내부에 남깁니다.", "정상·문자 수량·음수·재고 부족·잔액 부족·중간 commit 실패·retry 중복을 테스트합니다.", "로그와 exception에 card/token·전체 사용자 객체가 없는지 검증합니다."],
    expectedResult: ["호출자는 문자열 parsing 없이 exception code·field로 복구 정책을 선택합니다.", "실패한 주문은 inventory·balance를 부분 변경하지 않습니다.", "low-level cause와 domain 의미가 chain에 함께 남습니다.", "부분 batch 결과가 성공·실패 item을 구조적으로 보존합니다.", "HTTP·CLI 표현이 domain model과 분리됩니다.", "민감정보는 public response·trace attribute에 노출되지 않습니다."],
    cleanup: ["fake state를 각 test에서 새로 만듭니다."],
    extensions: ["ExceptionGroup으로 병렬 inventory 조회 실패를 묶습니다.", "saga compensation과 outbox idempotency를 설계합니다.", "error code localization catalog를 추가합니다.", "OpenTelemetry exception recording과 PII filter를 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 set_age·parse_score·Account·to_int를 실행하고 실패 정보 보존 수준을 비교하세요.", requirements: ["TypeError·ValueError raise와 bare re-raise traceback을 확인합니다.", "7,000원 잔액·43,000원 부족액을 속성으로 읽습니다.", "default 0과 실제 0의 모호성을 재현합니다.", "메시지 parsing 없이 handler를 다시 작성합니다."], hints: ["exception vars와 __cause__를 출력합니다.", "state를 실패 전후 비교합니다."], expectedOutcome: "raise·re-raise·custom field·fallback 손실을 실행으로 구분합니다.", solutionOutline: ["원본 기준 출력을 만듭니다.", "예외 속성과 state atomicity assertion을 추가합니다.", "default 변환을 Result 구조로 바꿉니다."] },
    { difficulty: "응용", prompt: "설정 파일 loader의 오류 hierarchy를 설계하세요.", requirements: ["FileNotFound·decode·JSON·schema·unknown version을 domain 오류로 분리합니다.", "raise from으로 원인을 보존합니다.", "field path·error code를 구조화하고 secret value를 제외합니다.", "필수/선택 설정의 fallback 정책을 구분합니다.", "여러 field validation issue를 수집합니다."], hints: ["모든 OSError를 하나의 재시도 오류로 만들지 않습니다.", "사용자 message와 internal cause를 분리합니다."], expectedOutcome: "복구 가능한 설정 오류와 programmer bug를 구분하는 loader API를 만듭니다." },
    { difficulty: "설계", prompt: "다중 서비스 결제의 distributed error contract를 설계하세요.", requirements: ["domain·transport·provider error code mapping을 정의합니다.", "retryable·permanent·unknown과 idempotency를 포함합니다.", "부분 성공·saga compensation·dead-letter를 설계합니다.", "exception chain과 remote error schema 경계를 구분합니다.", "PII·PCI data·traceback·audit log 정책을 포함합니다.", "client compatibility와 error schema versioning을 제시합니다."], hints: ["Python exception 객체를 wire로 pickle하지 않습니다.", "HTTP status 하나로 모든 복구 의미를 표현할 수 없습니다."], expectedOutcome: "custom exception 문법을 분산 transaction·호환성·보안 contract로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "raise와 bare raise의 차이는 무엇인가요?", answer: "raise Exception(...)은 새 지정 오류를 발생시키고 except 안 bare raise는 현재 잡은 같은 예외를 원래 traceback과 함께 재전파합니다." },
    { question: "사용자 정의 예외를 왜 Exception에서 상속하나요?", answer: "일반 application exception hierarchy에 참여해 구체·base handler로 선택적으로 처리할 수 있기 때문입니다." },
    { question: "예외 메시지에서 부족액을 parse해야 하나요?", answer: "아닙니다. amount·balance·shortfall 같은 구조화 속성을 사용합니다." },
    { question: "raise NewError from error는 무엇을 보존하나요?", answer: "높은 수준 예외의 __cause__로 원래 낮은 수준 오류를 연결해 abstraction과 root cause를 함께 보존합니다." },
    { question: "default=0 안전 변환의 위험은 무엇인가요?", answer: "실제 정상 0과 변환 실패를 같은 값으로 만들어 data 품질과 통계를 왜곡할 수 있습니다." },
    { question: "batch validation은 항상 첫 오류에서 raise해야 하나요?", answer: "아닙니다. 독립 항목이면 issue를 수집할 수 있지만 transaction 의미가 있으면 원자성·부분 commit 정책을 먼저 정합니다." },
    { question: "exception 객체에 전체 request를 넣어도 되나요?", answer: "traceback·로그·serialization에 민감정보가 노출될 수 있어 필요한 안전 field만 보존합니다." },
    { question: "domain exception이 곧 HTTP status인가요?", answer: "아닙니다. application/transport boundary가 domain 오류를 public status·schema로 매핑합니다." },
  ],
  completionChecklist: [
    "타입·값·domain invariant에 맞는 exception을 명시 raise할 수 있다.",
    "bare re-raise로 원래 traceback을 보존할 수 있다.",
    "구조화 field·code가 있는 안전한 custom exception을 설계할 수 있다.",
    "exception chaining으로 abstraction과 cause를 함께 전달할 수 있다.",
    "default·Optional·Result·exception 계약의 정보 손실을 비교할 수 있다.",
    "batch fail-fast·issue 수집·부분 commit·ExceptionGroup을 선택할 수 있다.",
    "실패 전 state invariant와 retry idempotency를 검증할 수 있다.",
    "domain 오류를 public response로 안전하게 매핑하고 PII를 제한할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-raise-source", repository: "PYTHON-BASIC", path: "day11_exception/ex04_raise.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day11_exception/ex04_raise.py", usedFor: ["TypeError·ValueError raise", "입력 validation", "bare re-raise", "상위 처리"], evidence: "원본을 Python 3.13.9에서 실행해 age 24·30 정상, -5 ValueError, 스물 TypeError, 99점 변환 로그와 상위 ValueError 처리를 확인했습니다." },
    { id: "py-custom-exception-source", repository: "PYTHON-BASIC", path: "day11_exception/ex05_custom_exception.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day11_exception/ex05_custom_exception.py", usedFor: ["InsufficientBalanceError", "구조화 balance·amount", "Account invariant", "부족액"], evidence: "원본 실행에서 10,000원 중 3,000원 출금 후 잔액 7,000원, 50,000원 요청의 부족액 43,000원을 확인했습니다." },
    { id: "py-practical-exception-source", repository: "PYTHON-BASIC", path: "day11_exception/ex06_practical.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day11_exception/ex06_practical.py", usedFor: ["안전 변환", "default", "valid/errors 분리", "누락 key"], evidence: "원본 실행에서 [10,20,0,0,0,40], valid [85,90,78,100]·errors x/-·평균 88.25, 누락 name/score 출력을 확인했습니다." },
    { id: "python-exception-doc", repository: "Python documentation", path: "tutorial/errors.html#raising-exceptions", publicUrl: "https://docs.python.org/3/tutorial/errors.html#raising-exceptions", usedFor: ["raise", "custom exception", "re-raise", "chaining"], evidence: "공식 tutorial을 명시 raise·사용자 exception·전파 설명의 기준으로 사용했습니다." },
    { id: "python-dataclass-doc", repository: "Python documentation", path: "library/dataclasses.html", publicUrl: "https://docs.python.org/3/library/dataclasses.html", usedFor: ["불변 ParseIssue result", "구조화 batch 오류"], evidence: "표준 dataclass를 exception 대신 data issue를 수집하는 경량 구조로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["HTTP framework별 exception handler 구현은 각 웹 framework 과정에서 다룹니다.", "error code versioning·ExceptionGroup·saga·PII tracing은 원본 raise/custom exception을 전문가 운영 contract로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;
