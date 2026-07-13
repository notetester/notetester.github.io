import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-035"],
  slug: "python-035-exception-classification-else-finally",
  courseId: "python",
  moduleId: "04-reliability-tooling",
  order: 35,
  title: "예외 분류·else·finally",
  subtitle: "실패를 무조건 숨기지 않고 복구 가능한 경계에서 구체적으로 분류하며, 성공 로직과 자원 정리를 모든 제어 흐름에서 보장합니다.",
  level: "중급",
  estimatedMinutes: 145,
  coreQuestion: "어떤 예외를 어디에서 처리하고 어떤 예외는 그대로 전파해야 원인을 보존하면서도 사용자에게 안전한 복구 흐름을 제공할 수 있을까요?",
  summary: "ValueError·ZeroDivisionError·TypeError·IndexError·KeyError·FileNotFoundError 원본을 실행 흐름으로 분류합니다. try의 최소 범위, except 순서와 tuple, else 성공 전용 영역, finally의 return·예외·break에도 실행되는 특성을 다룹니다. Exception과 BaseException 경계, context manager, traceback·logging·retry·fallback·부분 실패·민감정보 정책까지 신뢰 가능한 오류 경계로 확장합니다.",
  objectives: [
    "SyntaxError와 runtime exception, programmer bug와 예상 가능한 외부 실패를 구분할 수 있다.",
    "예외 발생 지점에서 try 나머지를 건너뛰고 호환되는 첫 except로 이동하는 흐름을 추적할 수 있다.",
    "가장 구체적인 예외부터 처리하고 broad Exception을 무조건 삼키지 않는 이유를 설명할 수 있다.",
    "else에 성공 후 로직을 두어 try 범위와 우연히 잡히는 예외를 줄일 수 있다.",
    "finally가 정상·return·break·예외 모두에서 실행되고 return/raise를 넣으면 원래 결과를 가릴 수 있음을 설명할 수 있다.",
    "파일·lock·transaction은 with와 finally를 사용해 자원 수명을 구조적으로 정리할 수 있다.",
    "예외를 복구·변환·재시도·전파할 경계를 정하고 traceback과 민감정보를 안전하게 보존할 수 있다.",
  ],
  prerequisites: [
    { title: "입력·형 변환·검증 경계", reason: "int 변환과 사용자 입력 실패를 ValueError로 분류합니다.", sessionSlug: "python-015-input-conversion-validation-boundary" },
    { title: "경로·파일 모드·context manager", reason: "finally와 with의 자원 정리 책임을 파일 수명에 연결합니다.", sessionSlug: "python-024-path-file-modes-context-manager" },
  ],
  keywords: ["Python", "exception", "try", "except", "else", "finally", "Exception", "BaseException", "traceback", "cleanup", "retry", "context manager"],
  chapters: [
    {
      id: "failure-taxonomy",
      title: "예외 처리는 모든 오류를 정상으로 바꾸는 문법이 아니라 실패 종류를 의미 있게 전달하는 구조입니다",
      lead: "문법 오류, 잘못된 입력, 외부 자원 실패, programmer bug는 서로 다른 수정·복구 주체를 가집니다.",
      explanations: [
        "SyntaxError는 code를 parse하는 단계에서 발견되어 해당 module 실행이 시작되지 못합니다. ZeroDivisionError·ValueError 같은 exception은 특정 실행 경로에서 runtime에 발생합니다. try/except로 SyntaxError까지 일반적으로 감싸는 것이 아니라 source를 수정합니다.",
        "사용자가 숫자 대신 문자를 입력한 ValueError는 다시 입력을 요청할 수 있는 예상 실패입니다. None attribute 접근 같은 AttributeError는 programmer bug일 수 있어 조용한 fallback보다 traceback과 수정이 필요합니다. 같은 exception class도 context에 따라 복구 가능성이 달라집니다.",
        "Exception은 대부분 application exception의 base이고 KeyboardInterrupt·SystemExit 같은 process control은 BaseException 쪽에 직접 속합니다. bare except는 종료 요청까지 잡을 수 있어 일반 application 경계에서는 except Exception을 쓰더라도 목적을 명시합니다.",
        "예외 이름과 메시지는 원인 진단 정보이지 최종 사용자 문구가 아닐 수 있습니다. 내부에는 구조화된 error code·cause·request ID를 보존하고 외부에는 민감 경로·SQL·token을 숨긴 안전한 메시지를 제공합니다.",
      ],
      concepts: [
        { term: "exception hierarchy", definition: "예외 class들이 상속 관계를 이루어 구체 exception이 상위 except와도 호환되는 구조입니다.", detail: ["구체 handler를 넓은 handler보다 먼저 둡니다.", "BaseException과 Exception 경계를 구분합니다."] },
        { term: "복구 가능성", definition: "현재 계층이 실패 원인을 이해하고 의미 있는 대체·재입력·재시도·보상을 수행할 수 있는 정도입니다.", detail: ["복구할 수 없으면 context를 보존해 전파합니다.", "무조건 계속 실행하는 것과 다릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "오류가 나도 프로그램은 계속되지만 결과가 틀리고 원인을 찾을 수 없다.", likelyCause: "broad except가 programmer bug까지 잡아 메시지 없이 pass하거나 임의 기본값을 반환합니다.", checks: ["except:, except Exception, pass, return None을 검색합니다.", "로그에 traceback이 보존되는지 확인합니다.", "해당 계층이 실제 복구 행동을 하는지 봅니다."], fix: "예상 구체 예외만 처리하고 복구 불가능한 오류는 context와 cause를 보존해 전파합니다.", prevention: "negative test와 lint의 bare-except 규칙, 오류 code·traceback 관찰성을 사용합니다." },
      ],
    },
    {
      id: "try-except-flow",
      title: "예외가 발생하면 try의 나머지 줄을 건너뛰고 첫 호환 except 하나만 실행합니다",
      lead: "원본 10/0 뒤 print(result)가 실행되지 않는 것처럼 성공하지 못한 작업의 후속 로직은 자동으로 건너뜁니다.",
      explanations: [
        "try block은 위에서 실행하다 예외가 발생하면 즉시 중단됩니다. exception type의 MRO에 맞는 except clause를 위에서 찾고 첫 하나만 실행합니다. handler가 끝나면 try statement 다음 흐름으로 진행하거나 handler에서 새 예외가 나면 전파됩니다.",
        "except ZeroDivisionError는 0 나눗셈만 처리하고 int('백이십') ValueError는 처리하지 않습니다. 원본은 as e로 exception 객체를 받아 type(e).__name__과 메시지를 관찰합니다. 메시지 text parsing에 business logic을 의존하지 말고 class·구조화 속성을 사용합니다.",
        "except (ValueError, ZeroDivisionError)처럼 복구 행동이 정말 같을 때 tuple로 묶을 수 있습니다. 사용자에게 다시 입력 요청이라는 행동은 같아도 내부 metric은 exception type별로 남길 수 있습니다.",
        "try가 너무 넓으면 int 변환뿐 아니라 이후 DB save의 ValueError까지 같은 입력 오류로 오해할 수 있습니다. 실패할 것으로 예상하는 최소 expression·operation만 감쌉니다.",
      ],
      concepts: [
        { term: "handler selection", definition: "발생 exception 객체가 except에 적힌 class의 instance인지 위에서 검사해 첫 호환 block을 선택하는 과정입니다.", detail: ["subclass handler가 먼저 와야 합니다.", "선택된 handler 하나만 실행됩니다."] },
      ],
      codeExamples: [
        {
          id: "classified-parse-divide",
          title: "변환·0 나눗셈·성공을 서로 다른 흐름으로 분류",
          language: "python",
          filename: "classified_errors.py",
          purpose: "try·구체 except·else·finally의 실행 순서를 세 입력에서 안정적으로 출력합니다.",
          code: "def parse_and_divide(raw):\n    events = [f'input={raw!r}']\n    try:\n        denominator = int(raw)\n        result = 100 / denominator\n    except ValueError:\n        events.append('except:ValueError')\n    except ZeroDivisionError:\n        events.append('except:ZeroDivisionError')\n    else:\n        events.append(f'else:result={result:.1f}')\n    finally:\n        events.append('finally:done')\n    return events\n\nfor raw in ['10', 'abc', '0']:\n    print(' | '.join(parse_and_divide(raw)))",
          walkthrough: [
            { lines: "1-5", explanation: "입력 관찰 event를 만들고 int 변환과 나눗셈만 try에 둡니다." },
            { lines: "6-9", explanation: "문자 변환 실패와 0 나눗셈을 구체 handler로 구분합니다." },
            { lines: "10-11", explanation: "두 위험 연산이 모두 성공한 경우에만 else가 결과를 기록합니다." },
            { lines: "12-14", explanation: "모든 경로에서 finally marker를 추가한 뒤 같은 list 결과를 반환합니다." },
            { lines: "16-17", explanation: "정상·잘못된 문자열·0 세 경로의 정확한 순서를 비교합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "classified_errors.py로 저장"], command: "python classified_errors.py" },
          output: { value: "input='10' | else:result=10.0 | finally:done\ninput='abc' | except:ValueError | finally:done\ninput='0' | except:ZeroDivisionError | finally:done", explanation: ["정상 case는 except 없이 else와 finally가 실행됩니다.", "각 실패는 맞는 handler 하나와 finally만 실행합니다.", "finally는 세 경로 모두 마지막입니다."] },
          experiments: [
            { change: "except Exception을 ValueError 앞에 둡니다.", prediction: "ValueError·ZeroDivisionError 모두 넓은 handler가 먼저 잡아 구체 handler가 실행되지 않습니다.", result: "handler는 구체→일반 순서로 둬야 합니다." },
            { change: "events.append 결과 형식을 try 안 result 계산 뒤에 둡니다.", prediction: "그 표현 자체에서 오류가 나면 현재 except가 의도와 다르게 잡을 수 있습니다.", result: "else가 성공 후 로직과 위험 연산의 오류 범위를 분리합니다." },
          ],
          sourceRefs: ["py-try-source", "py-exception-types-source", "py-else-finally-source"],
        },
      ],
      diagnostics: [
        { symptom: "구체 except가 절대 실행되지 않는다.", likelyCause: "그보다 앞의 Exception 같은 상위 class handler가 모든 subclass 예외를 먼저 잡습니다.", checks: ["except clause 순서와 exception MRO를 확인합니다.", "lint unreachable handler 경고를 봅니다.", "각 예외를 독립 fixture로 발생시킵니다."], fix: "가장 구체적인 handler를 먼저 두고 마지막에 필요한 경우만 넓은 boundary handler를 둡니다.", prevention: "handler별 branch coverage와 exception type assertion을 유지합니다." },
      ],
    },
    {
      id: "else-success-boundary",
      title: "else는 try가 예외 없이 끝났을 때만 실행되어 성공 후 로직의 오류를 잘못 잡지 않게 합니다",
      lead: "parse·acquire처럼 예상 실패 작업은 try에, 그 결과를 사용하는 다음 단계는 else에 두면 handler 책임이 선명합니다.",
      explanations: [
        "try: value=int(raw); save(value)처럼 두 작업을 넣고 except ValueError를 두면 save 내부 ValueError까지 사용자 숫자 입력 오류로 표시될 수 있습니다. int만 try에 두고 else에서 save하면 save 오류는 현재 handler가 삼키지 않고 올바른 상위 경계로 전파됩니다.",
        "else는 except가 실행된 뒤 실행되는 block이 아닙니다. exception이 전혀 없을 때만 실행됩니다. 복구 handler 뒤 공통 흐름이 필요하면 try statement 다음에 둡니다.",
        "try 안 return이 실행되면 else로 가지 않고 finally를 거쳐 함수가 반환됩니다. 성공 return을 else에 두면 읽는 사람이 성공 경로를 분리해 볼 수 있습니다.",
        "else 자체에서 exception이 나면 같은 try의 except가 잡지 않습니다. 이것이 오류 책임을 분리하는 의도이며 상위 계층이 처리하거나 별도 좁은 try를 둡니다.",
      ],
      concepts: [
        { term: "success-only branch", definition: "try body가 끝까지 예외 없이 완료된 경우에만 실행되는 else block입니다.", detail: ["handler 범위를 최소화합니다.", "else에서 난 예외는 앞 except가 처리하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "DB·formatting 내부 ValueError가 사용자 입력 변환 오류로 잘못 표시된다.", likelyCause: "여러 책임을 넓은 try 하나에 넣고 ValueError 하나로 처리했습니다.", checks: ["try 안 모든 call이 같은 exception class를 낼 수 있는지 봅니다.", "traceback origin을 확인합니다.", "parse 성공 후 단계를 else로 옮길 수 있는지 봅니다."], fix: "예상 실패 operation만 try에 남기고 성공 후 작업을 else 또는 다음 계층으로 분리합니다.", prevention: "handler가 처리할 operation·exception pair를 code review에서 한 문장으로 설명합니다." },
      ],
    },
    {
      id: "finally-control-flow",
      title: "finally는 block을 떠나기 전에 실행되며 return·raise를 넣으면 원래 결과와 예외를 가릴 수 있습니다",
      lead: "정리는 finally에 두되 새로운 제어 흐름을 만들지 않는 것이 원래 성공·실패 의미를 보존하는 핵심입니다.",
      explanations: [
        "finally는 정상 완료, handled/unhandled exception, return, break, continue에서 해당 try statement를 떠나기 전에 실행됩니다. 그래서 lock release·temporary state 복원처럼 무조건 필요한 정리에 적합합니다.",
        "try에서 return value를 준비해도 실제 함수 반환 전에 finally가 실행됩니다. 반환 객체가 mutable이면 finally의 변경이 caller에게 보일 수 있습니다. finally에서 return하면 원래 return과 active exception을 덮어써 원인을 숨기므로 피합니다.",
        "finally에서 새 exception이 발생하면 원래 exception context와 연결될 수 있지만 cleanup failure가 root cause를 가릴 수 있습니다. 자원 정리는 가능한 단순·idempotent하게 만들고 두 실패를 모두 관찰할 구조를 사용합니다.",
        "finally는 업무 transaction commit/rollback 의미를 자동으로 알지 못합니다. 성공에서 commit, 실패에서 rollback, 항상 close가 필요하면 context manager나 명시 transaction API가 더 정확합니다.",
      ],
      concepts: [
        { term: "control-flow suppression", definition: "finally의 return·break·continue·새 예외가 try의 기존 return 또는 exception을 덮어 원래 흐름을 보이지 않게 하는 현상입니다.", detail: ["finally에서는 정리만 수행합니다.", "lint가 return-in-finally를 경고할 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "finally-before-return",
          title: "return 준비 뒤에도 finally가 실행되는 순서",
          language: "python",
          filename: "finally_flow.py",
          purpose: "정상 return과 recovered return 모두에서 같은 mutable event list가 finally에 의해 갱신되는 사실을 확인합니다.",
          code: "def run(mode):\n    events = ['try:start']\n    try:\n        if mode == 'error':\n            raise ValueError('boom')\n        events.append('try:return-ready')\n        return 'ok', events\n    except ValueError:\n        events.append('except:return-ready')\n        return 'recovered', events\n    finally:\n        events.append('finally:cleanup')\n\nfor mode in ['normal', 'error']:\n    status, events = run(mode)\n    print(f'{mode}: {status} | {events}')",
          walkthrough: [
            { lines: "1-7", explanation: "정상 경로는 tuple 반환을 준비하지만 함수 밖으로 나가기 전 finally가 남아 있습니다." },
            { lines: "8-10", explanation: "ValueError 경로도 handler에서 recovered 반환을 준비합니다." },
            { lines: "11-12", explanation: "두 경로 모두 같은 events list에 cleanup marker를 추가한 뒤 실제 반환됩니다." },
            { lines: "14-16", explanation: "caller가 받은 list에서 finally marker가 마지막에 보이는지 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "finally_flow.py로 저장"], command: "python finally_flow.py" },
          output: { value: "normal: ok | ['try:start', 'try:return-ready', 'finally:cleanup']\nerror: recovered | ['try:start', 'except:return-ready', 'finally:cleanup']", explanation: ["정상 return과 except return이 모두 finally 이후 완료됩니다.", "반환 tuple 안 list가 같은 객체라 cleanup append가 caller 결과에 포함됩니다.", "finally는 status를 덮지 않고 정리만 합니다."] },
          experiments: [
            { change: "finally 마지막에 return 'forced', events를 추가합니다.", prediction: "두 mode 모두 status가 forced로 바뀌고 active exception도 억제될 수 있습니다.", result: "finally return이 원래 제어 흐름을 가리는 위험을 확인합니다." },
            { change: "finally에서 RuntimeError를 발생시킵니다.", prediction: "정상과 recovered return 모두 취소되고 RuntimeError가 caller에 전파됩니다.", result: "cleanup 자체 실패 정책과 관찰성이 필요합니다." },
          ],
          sourceRefs: ["py-else-finally-source", "python-exception-doc"],
        },
      ],
      diagnostics: [
        { symptom: "분명 예외가 났는데 함수가 정상값을 반환하거나 원래 traceback이 사라진다.", likelyCause: "finally block에 return·break·continue 또는 다른 예외 억제 흐름이 있습니다.", checks: ["finally 안 제어문을 검색합니다.", "lint warning을 확인합니다.", "원래 예외를 최소 예제로 발생시킵니다."], fix: "finally에서는 cleanup만 하고 결과·예외 결정은 try/except/else에 둡니다.", prevention: "return-in-finally lint와 예외 전파 test를 사용합니다." },
      ],
    },
    {
      id: "cleanup-context-managers",
      title: "자원 획득과 반환은 with context manager로 같은 구조에 묶고 finally는 더 일반적인 복원에 사용합니다",
      lead: "원본 file close finally는 원리를 보여 주지만 실제 파일 코드는 with가 더 짧고 누락 가능성이 낮습니다.",
      explanations: [
        "f=None을 두고 try에서 open, finally에서 if f is not None: close하는 패턴은 open 자체 실패와 부분 획득을 고려한 수동 구조입니다. with open(...) as f는 성공한 __enter__ 뒤 block을 떠날 때 __exit__가 close합니다.",
        "lock, DB transaction, temporary directory, decimal localcontext도 context manager를 제공합니다. 자원마다 exception에서 rollback·suppress 여부가 다르므로 문서를 확인합니다. with가 모든 예외를 자동 처리한다고 가정하지 않습니다.",
        "여러 동적 자원은 contextlib.ExitStack으로 획득 성공 순서의 역순 정리를 등록할 수 있습니다. 일부 획득 실패 시 이미 등록한 자원도 정리됩니다.",
        "직접 context manager를 만들 때 __exit__가 True를 반환하면 exception을 suppress합니다. 정말 복구한 특정 예외만 억제하고 programmer bug를 숨기지 않습니다. contextlib.contextmanager generator도 yield 전후와 예외 흐름을 정확히 설계합니다.",
      ],
      concepts: [
        { term: "structured cleanup", definition: "자원 획득과 사용·반환을 lexical block으로 묶어 모든 탈출 경로에서 정리가 실행되게 하는 구조입니다.", detail: ["with와 try/finally가 핵심입니다.", "업무 rollback semantics는 자원별 contract를 따릅니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "오류나 return이 있는 경로에서 file·connection·lock이 남는다.", likelyCause: "close/release가 일반 성공 경로 마지막에만 있고 구조적 cleanup이 없습니다.", checks: ["모든 return·raise·break 경로를 표시합니다.", "열린 descriptor·pool·lock metric을 확인합니다.", "with 또는 finally 범위가 실제 획득을 포함하는지 봅니다."], fix: "자원 제공 context manager를 사용하거나 획득 직후 finally/ExitStack에 정리를 등록합니다.", prevention: "fault injection과 early-return test에서 자원 수가 원래대로 돌아오는지 검증합니다." },
      ],
    },
    {
      id: "exception-objects-and-tracebacks",
      title: "예외 객체와 traceback은 실패 type·값·호출 경로를 보존하며 메시지 문자열보다 구조가 중요합니다",
      lead: "as error로 받은 객체에는 class와 args, 일부 예외의 filename·name·lineno 같은 구조화 정보가 있고 traceback은 실패까지의 호출 stack을 보여 줍니다.",
      explanations: [
        "str(error)는 사람에게 유용하지만 Python 버전·운영체제·library에 따라 문구가 달라질 수 있습니다. 복구 분기는 메시지 일부 문자열이 아니라 isinstance와 공식 구조화 속성으로 결정합니다. AttributeError.name, ImportError.name, OSError.errno처럼 class별 계약을 확인합니다.",
        "traceback은 예외가 전파된 호출 frame을 보여 줍니다. 보통 마지막 frame이 실제 raise 지점이지만 wrapper·chaining이 있으면 cause와 context도 확인합니다. 가장 바깥 error 문구만 보고 원인을 추측하지 않습니다.",
        "except block을 떠난 뒤 exception 변수는 reference cycle을 줄이기 위해 정리될 수 있으므로 나중에 쓸 정보는 안전한 구조로 추출합니다. 전체 traceback 객체를 global cache에 오래 보관하면 frame의 local과 민감 data·메모리를 붙잡을 수 있습니다.",
        "logging.exception은 handler 안에서 현재 traceback을 기록합니다. 사용자에게 traceback 전체를 보여 주지 않고 내부 접근 제어된 log에 저장하며 file path·query·payload·token을 masking합니다. 같은 실패를 여러 계층에서 중복 기록하지 않습니다.",
      ],
      concepts: [
        { term: "traceback", definition: "예외가 발생해 현재 handler까지 전파된 호출 stack과 각 source 위치를 나타내는 진단 정보입니다.", detail: ["root cause와 호출 context를 추적합니다.", "frame local에 민감 data가 있을 수 있습니다."] },
        { term: "structured exception attribute", definition: "예외 메시지 text 외에 name·filename·errno·lineno처럼 프로그램이 안정적으로 읽도록 exception class가 제공하는 field입니다.", detail: ["class별 문서를 확인합니다.", "복구 로직의 문자열 message parsing을 줄입니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "예외 메시지 문구가 바뀌어 오류 분류 test와 복구 로직이 깨진다.", likelyCause: "exception class·속성 대신 str(error)의 특정 한국어·영문 substring을 protocol로 사용했습니다.", checks: ["메시지 문자열 비교 코드를 검색합니다.", "exception의 type·args·공식 field를 확인합니다.", "Python·OS·library 버전별 문구 차이를 재현합니다."], fix: "구체 exception class와 공식 구조화 속성·domain error code로 분기하고 메시지는 표시용으로만 사용합니다.", prevention: "오류 code contract test와 여러 환경 CI를 사용합니다." },
      ],
    },
    {
      id: "exception-boundaries-retry-logging",
      title: "예외는 복구할 수 있는 계층에서만 처리하고 나머지는 context·cause와 함께 전파합니다",
      lead: "low-level 함수는 사용자 메시지나 process exit를 결정하기보다 의미 있는 예외를 던지고 application boundary가 정책을 선택합니다.",
      explanations: [
        "library가 print하고 None을 반환하면 caller는 실패와 정상 None을 구분하기 어렵습니다. low-level FileNotFoundError를 domain ConfigurationError로 바꿀 수 있지만 raise NewError(...) from error로 원래 cause를 보존합니다. 다음 세션에서 custom exception을 깊게 다룹니다.",
        "재시도는 timeout·일시 네트워크 오류처럼 transient하고 operation이 idempotent할 때만 수행합니다. ValueError·권한 거부·schema 오류를 반복해도 해결되지 않습니다. exponential backoff·jitter·최대 횟수·deadline·cancellation을 적용합니다.",
        "fallback은 품질 저하를 숨길 수 있습니다. cache stale 사용·기본값 반환 시 결과에 degraded 상태를 표시하고 metric·alert를 남깁니다. 잘못된 금융 금액을 0으로 fallback하지 않습니다.",
        "logger.exception은 active exception traceback을 기록하지만 원문 input·파일 경로·token이 메시지에 들어가지 않게 합니다. 같은 예외를 모든 계층에서 중복 full traceback으로 로그하지 말고 책임 boundary 한 곳에서 correlation ID와 구조화 field를 남깁니다.",
      ],
      concepts: [
        { term: "exception boundary", definition: "실패를 domain 오류·사용자 응답·retry·process exit로 변환할 책임이 있는 application 계층 경계입니다.", detail: ["CLI main·HTTP handler·worker job runner가 예입니다.", "하위 계층은 context를 보존해 전파합니다."] },
        { term: "transient failure", definition: "시간이 지나거나 다시 연결하면 성공할 가능성이 있는 일시적 외부 실패입니다.", detail: ["모든 예외가 transient는 아닙니다.", "retry는 idempotency와 deadline이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "실패를 어떻게 처리할까요?", options: [
          { name: "복구·fallback", chooseWhen: "현재 계층이 의미 있는 대체 결과와 품질 표시를 제공할 수 있을 때", avoidWhen: "정상값과 구분되지 않는 임의 0·빈 list를 반환할 때", tradeoffs: ["가용성을 높일 수 있습니다.", "degraded 결과를 명시해야 합니다.", "근본 오류 관찰성을 보존합니다."] },
          { name: "retry", chooseWhen: "일시적이고 idempotent하거나 중복 방지된 operation일 때", avoidWhen: "validation·권한·programmer bug·deadline 초과", tradeoffs: ["transient 오류를 회복할 수 있습니다.", "부하 증폭과 중복 side effect 위험이 있습니다.", "backoff·jitter·limit가 필요합니다."] },
          { name: "전파·변환", chooseWhen: "현재 계층이 복구할 수 없고 상위 boundary가 정책을 알아야 할 때", avoidWhen: "이미 충분히 복구했는데 같은 오류를 중복 처리할 때", tradeoffs: ["원인과 책임을 보존합니다.", "domain context를 추가할 수 있습니다.", "exception chaining과 안전 메시지가 필요합니다."] },
        ] },
      ],
      expertNotes: ["Python 3.11+ ExceptionGroup과 except*는 병렬 task 여러 실패를 보존할 수 있으나 각 exception의 resource cleanup과 cancellation 정책을 함께 설계합니다.", "asyncio.CancelledError를 broad handler로 삼켜 cancellation을 방해하지 말고 finally/async with에서 정리한 뒤 재전파합니다."],
    },
  ],
  lab: {
    title: "안전한 CSV import 오류 경계",
    scenario: "CSV 행을 parse·validate·저장하는 pipeline에서 행별 복구 가능한 오류와 파일·저장소 전체 실패를 구분하고 자원을 항상 정리합니다.",
    setup: ["safe_import.py와 test_safe_import.py를 만듭니다.", "TemporaryDirectory의 합성 CSV와 fake repository를 사용합니다.", "행에는 id·name·score가 있고 score는 0~100 정수입니다."],
    steps: ["open과 csv.reader는 with로 감싸고 FileNotFoundError·UnicodeDecodeError를 file boundary에서 분류합니다.", "행별 int 변환과 schema 검증은 좁은 try로 처리하고 오류 record ID·line number만 수집합니다.", "성공 parse 뒤 repository save는 else 또는 별도 함수로 두어 ValueError를 입력 오류로 오해하지 않게 합니다.", "repository 일시 오류와 영구 오류를 구분하고 idempotent fake에서만 제한 retry합니다.", "unexpected Exception은 traceback을 보존해 job boundary로 전파합니다.", "finally에는 metric timer·temporary state 복원만 두고 return하지 않습니다.", "정상·문자 점수·0/100·누락 column·없는 파일·decode 오류·save 오류·cleanup 오류를 테스트합니다.", "오류 report에 전체 원문·절대 경로·민감 이름이 노출되지 않게 합니다."],
    expectedResult: ["잘못된 한 행은 정책에 따라 격리되고 나머지 정상 행이 처리됩니다.", "파일 전체 실패와 행 validation 실패가 다른 오류 code입니다.", "save 내부 ValueError가 parse 오류로 잘못 잡히지 않습니다.", "모든 성공·실패 경로에서 file·transaction이 닫힙니다.", "retry 불가능 오류가 반복되지 않습니다.", "unexpected bug의 traceback·cause는 내부 관찰성에 남고 사용자 메시지는 안전합니다."],
    cleanup: ["TemporaryDirectory와 fake resource를 정리합니다."],
    extensions: ["ExceptionGroup으로 병렬 행 batch 실패를 보존합니다.", "dead-letter artifact와 재처리 idempotency를 설계합니다.", "async repository와 cancellation cleanup을 추가합니다.", "OpenTelemetry span status와 구조화 error code를 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex01~03의 모든 정상·실패 흐름을 순서표로 작성하세요.", requirements: ["ZeroDivisionError·ValueError·TypeError·IndexError·KeyError를 재현합니다.", "except tuple과 개별 handler를 비교합니다.", "safe_divide 정상·0에서 else/finally 순서를 기록합니다.", "finally file close를 with로 다시 작성합니다."], hints: ["각 block 시작에 marker를 추가합니다.", "try 안 예외 뒤 줄이 실행되지 않는지 확인합니다."], expectedOutcome: "try·except·else·finally의 모든 branch를 정확히 예측합니다.", solutionOutline: ["원본 출력 기준을 저장합니다.", "한 예외씩 최소 입력으로 실행합니다.", "자원 정리를 context manager로 대체합니다."] },
    { difficulty: "응용", prompt: "외부 API 응답 parse 함수를 오류 계층으로 설계하세요.", requirements: ["timeout·HTTP status·JSON syntax·schema·domain 오류를 분리합니다.", "retry 가능한 오류와 불가능 오류를 표로 만듭니다.", "else로 성공 후 domain 변환을 분리합니다.", "cause를 보존하고 사용자 응답에서 민감 payload를 숨깁니다.", "finally/with로 response를 정리합니다."], hints: ["broad Exception을 모두 timeout으로 바꾸지 않습니다.", "JSON parse 성공과 schema 성공은 다릅니다."], expectedOutcome: "호출자가 복구 정책을 선택할 수 있는 오류 경계를 만듭니다." },
    { difficulty: "설계", prompt: "비동기 worker의 job failure architecture를 설계하세요.", requirements: ["validation·transient dependency·permanent dependency·bug·cancellation을 분류합니다.", "retry/backoff/jitter/dead-letter/idempotency를 정의합니다.", "ExceptionGroup과 부분 성공 정책을 검토합니다.", "resource cleanup·transaction rollback·shutdown cancellation을 포함합니다.", "traceback·correlation ID·PII masking·alert dedup을 설계합니다.", "finally에서 원래 예외를 가리지 않는 test를 제시합니다."], hints: ["retry는 실패 분류와 side effect 멱등성 이후 결정합니다.", "CancelledError를 일반 실패로 계속 재시도하지 않습니다."], expectedOutcome: "문법을 운영 복구·관찰성·데이터 무결성 architecture로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "try 안에서 예외가 발생한 뒤 같은 block의 다음 줄은 실행되나요?", answer: "아닙니다. try를 중단하고 첫 호환 except를 찾습니다." },
    { question: "except Exception을 가장 먼저 두면 어떤 문제가 있나요?", answer: "ValueError 같은 subclass 예외를 먼저 잡아 뒤의 구체 handler가 실행되지 않습니다." },
    { question: "else는 언제 실행되나요?", answer: "try가 예외 없이 끝났을 때만 실행되며 except 뒤 공통 block이 아닙니다." },
    { question: "finally는 return 때도 실행되나요?", answer: "예. 실제 반환 전에 실행되며 finally의 return은 원래 결과·예외를 가릴 수 있습니다." },
    { question: "with를 쓰면 exception을 자동으로 복구하나요?", answer: "대개 자원 정리를 보장할 뿐이며 suppress 여부는 context manager의 __exit__ 계약에 따릅니다." },
    { question: "bare except가 KeyboardInterrupt까지 잡을 수 있나요?", answer: "예. BaseException 계층까지 잡을 수 있어 일반 application에서는 피합니다." },
    { question: "모든 네트워크 오류를 retry해야 하나요?", answer: "아닙니다. transient·idempotent·deadline 내 오류만 제한적으로 retry합니다." },
    { question: "예외를 domain 오류로 바꿀 때 원인을 어떻게 보존하나요?", answer: "raise DomainError(...) from original처럼 exception chaining을 사용합니다." },
  ],
  completionChecklist: [
    "문법 오류·예상 외부 실패·programmer bug를 분류할 수 있다.",
    "try 중단과 첫 호환 except 선택 흐름을 추적할 수 있다.",
    "구체 exception과 최소 try 범위를 설계할 수 있다.",
    "else를 성공 후 로직에 사용해 handler 책임을 분리할 수 있다.",
    "finally의 모든 탈출 경로 실행과 suppression 위험을 설명할 수 있다.",
    "with·ExitStack으로 자원을 구조적으로 정리할 수 있다.",
    "복구·fallback·retry·전파를 실패 성격에 맞게 선택할 수 있다.",
    "traceback·cause를 보존하면서 민감 사용자 메시지와 로그를 분리할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-try-source", repository: "PYTHON-BASIC", path: "day11_exception/ex01_try_except.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day11_exception/ex01_try_except.py", usedFor: ["ZeroDivisionError", "ValueError as e", "정상 try", "실행 지속"], evidence: "원본을 Python 3.13.9에서 실행해 0 나눗셈 처리, 백이십 변환 ValueError 종류·메시지, 정상 123→246 출력을 확인했습니다." },
    { id: "py-exception-types-source", repository: "PYTHON-BASIC", path: "day11_exception/ex02_exception_types.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day11_exception/ex02_exception_types.py", usedFor: ["다중 except", "TypeError", "IndexError", "KeyError", "except tuple"], evidence: "원본 실행에서 10/2=5.0, 0·문자 나눗셈 분류, list/dict 오류와 문자열·0 반복 변환 오류를 확인했습니다." },
    { id: "py-else-finally-source", repository: "PYTHON-BASIC", path: "day11_exception/ex03_else_finally.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day11_exception/ex03_else_finally.py", usedFor: ["else", "finally", "정상/예외 순서", "파일 close"], evidence: "원본 실행에서 safe_divide 정상의 else→finally, 0의 except→finally, 파일 성공 뒤 finally close와 demo 정리를 확인했습니다." },
    { id: "python-exception-doc", repository: "Python documentation", path: "tutorial/errors.html", publicUrl: "https://docs.python.org/3/tutorial/errors.html", usedFor: ["예외 hierarchy", "try·except·else·finally", "raise/chaining", "cleanup"], evidence: "공식 errors and exceptions tutorial을 handler 선택·else·finally·전파 설명의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["raise·custom exception·re-raise 구조화 속성은 py-036에서 이어서 깊게 다룹니다.", "ExceptionGroup·async cancellation·retry/idempotency·민감 로그는 원본 try 예제를 전문가 운영 경계로 보강한 내용입니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "hierarchy-catch-scope-and-else-evidence",
    title: "예외 hierarchy와 최소 catch scope로 실패 원인을 보존합니다",
    lead: "except는 type hierarchy를 따라 matching하므로 좁은 예외를 먼저 잡고, try에는 실제로 분류하려는 연산만 두며 성공 후 처리는 else로 옮깁니다.",
    explanations: [
      "BaseException 아래에는 일반 application 실패의 Exception과 종료 신호 성격의 KeyboardInterrupt·SystemExit 등이 있습니다. 무차별 except BaseException은 사용자의 취소와 process 종료까지 삼킬 수 있습니다.",
      "except 절은 위에서부터 검사되므로 Exception을 먼저 두면 ValueError·OSError 같은 하위 분기가 도달 불가능해집니다. 복구 행동이 같은 인접 예외만 tuple로 묶습니다.",
      "try 범위가 넓으면 내부 후처리 코드의 ValueError까지 사용자 입력 오류로 오분류할 수 있습니다. 파싱·I/O처럼 실제 실패 경계만 try에 두고 성공 경로의 계산·commit은 else에 둡니다.",
      "else는 어떤 except도 실행되지 않았을 때만 수행됩니다. 오류가 없었다는 상태와 반환값의 truthiness를 혼동하지 않고 성공 후 side effect를 분리할 수 있습니다.",
      "예외 message는 Python 버전·운영체제에 따라 달라질 수 있습니다. 외부 계약에는 안정된 domain code를 사용하고 내부 log에는 exception type·cause·traceback을 구조화합니다.",
    ],
    concepts: [
      { term: "exception hierarchy", definition: "상위 예외 handler가 모든 하위 예외 인스턴스와 일치하는 상속 구조입니다.", detail: ["좁은 handler를 먼저 배치합니다.", "종료 계열 BaseException은 일반 복구 대상이 아닙니다."] },
      { term: "catch scope", definition: "한 try가 예외를 특정 의미로 분류하려고 감싸는 코드 범위입니다.", detail: ["최소화해야 오분류가 줄어듭니다.", "성공 후 처리는 else로 이동합니다."] },
    ],
    codeExamples: [{
      id: "exception-hierarchy-scope-else-finally",
      title: "파싱·0 나눗셈·성공과 finally 실행 순서를 분류합니다",
      language: "python",
      filename: "exception_flow_contract.py",
      purpose: "각 입력이 어느 handler로 가고 finally가 모든 return 전에 실행되는지 exact output으로 증명합니다.",
      code: String.raw`events = []

def parse_ratio(text):
    events.append(f"start:{text}")
    try:
        left, right = text.split("/", maxsplit=1)
        numerator = int(left)
        denominator = int(right)
        value = numerator / denominator
    except ValueError:
        result = "invalid-number"
    except ZeroDivisionError:
        result = "zero-denominator"
    else:
        result = f"ok:{value:.2f}"
    finally:
        events.append(f"finish:{text}")
    return result

for raw in ["6/3", "x/3", "1/0"]:
    print(raw, "->", parse_ratio(raw))
print("events:", events)
print("hierarchy:", issubclass(ValueError, Exception), issubclass(KeyboardInterrupt, Exception))`,
      walkthrough: [
        { lines: "1-18", explanation: "파싱·나눗셈만 try에 두고 ValueError와 ZeroDivisionError를 별도 결과로 분류하며 성공은 else에서 만듭니다." },
        { lines: "15-18", explanation: "finally가 정상·두 예외 모두에서 finish event를 남긴 뒤 함수가 반환됩니다." },
        { lines: "20-23", explanation: "세 입력 결과와 ValueError/KeyboardInterrupt의 Exception 계층 관계를 확인합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 exception_flow_contract.py" },
      output: { value: "6/3 -> ok:2.00\nx/3 -> invalid-number\n1/0 -> zero-denominator\nevents: ['start:6/3', 'finish:6/3', 'start:x/3', 'finish:x/3', 'start:1/0', 'finish:1/0']\nhierarchy: True False", explanation: ["KeyboardInterrupt는 Exception의 하위가 아니므로 일반 except Exception에서 잡히지 않습니다.", "finally event는 모든 입력에 정확히 한 번 기록됩니다."] },
      experiments: [
        { change: "except Exception을 첫 절로 올립니다.", prediction: "두 구체 handler는 실행되지 않고 실패 원인 구분이 사라집니다.", result: "handler 순서가 hierarchy 의미를 바꿉니다." },
        { change: "result formatting을 try 안으로 옮기고 의도적으로 ValueError를 냅니다.", prediction: "입력 파싱 오류처럼 잘못 분류될 수 있습니다.", result: "최소 catch scope가 필요한 이유입니다." },
        { change: "finally에서 return을 실행합니다.", prediction: "기존 예외·return을 덮어쓸 수 있습니다.", result: "finally는 cleanup에 집중해야 합니다." },
      ],
      sourceRefs: ["python-exception-hierarchy", "python-try-statement", "python-handling-exceptions"],
    }],
    diagnostics: [
      { symptom: "KeyboardInterrupt를 눌러도 프로그램이 종료되지 않는다.", likelyCause: "except BaseException 또는 bare except가 취소 신호를 삼켰습니다.", checks: ["handler type을 확인합니다.", "SystemExit·KeyboardInterrupt 재발생 여부를 봅니다.", "loop retry 경계를 추적합니다."], fix: "복구 가능한 Exception 하위의 좁은 type만 잡고 취소·종료 신호는 전파합니다.", prevention: "bare except lint와 취소 integration test를 둡니다." },
      { symptom: "입력 파싱 오류 handler가 성공 후 저장 코드의 ValueError까지 처리한다.", likelyCause: "try 범위가 너무 넓어 서로 다른 실패 경계를 같은 의미로 분류했습니다.", checks: ["traceback의 실제 발생 줄을 확인합니다.", "try와 else 경계를 표시합니다.", "handler가 복구 가능한 실패만 잡는지 검토합니다."], fix: "파싱만 try에 두고 후처리는 else 또는 다음 domain layer로 이동합니다.", prevention: "한 try에 한 recovery intent 원칙을 review checklist에 둡니다." },
    ],
    expertNotes: ["예외 type은 control-flow protocol입니다. message substring으로 분기하지 말고 domain exception·error code·cause를 사용합니다."],
  },
  {
    id: "context-manager-cleanup-boundary",
    title: "context manager로 acquire·use·release를 한 구조에 묶습니다",
    lead: "with는 __enter__ 성공 뒤 suite가 정상 종료되거나 예외가 나도 __exit__를 호출해 자원 lifetime을 lexical scope에 고정합니다.",
    explanations: [
      "파일·lock·transaction 같은 자원은 acquire 성공 여부와 release 호출을 함께 다뤄야 합니다. 수동 try/finally는 가능하지만 context manager가 이 protocol을 재사용 가능한 객체로 캡슐화합니다.",
      "__enter__ 자체가 실패하면 자원을 획득하지 못했으므로 해당 객체의 __exit__는 호출되지 않습니다. 여러 자원을 안전하게 조합할 때 ExitStack을 사용할 수 있습니다.",
      "__exit__가 truthy를 반환하면 전달된 예외를 suppress합니다. 광범위한 suppress는 장애를 숨기므로 예상한 좁은 예외와 명시 fallback에만 사용합니다.",
      "contextlib.contextmanager는 generator의 yield 앞을 acquire, yield 뒤 finally를 release로 표현합니다. 정확히 한 번 yield해야 하며 cleanup 예외가 원래 예외를 가릴 수 있음을 고려합니다.",
      "cleanup의 성공을 business operation 성공과 혼동하지 않습니다. commit/rollback, close 실패와 원래 실패를 cause·log policy로 보존합니다.",
    ],
    concepts: [
      { term: "context management protocol", definition: "__enter__와 __exit__로 자원 scope 시작·종료를 정의하는 protocol입니다.", detail: ["with 문이 호출 순서를 보장합니다.", "예외 suppress 여부도 __exit__ 반환 계약입니다."] },
      { term: "lexical lifetime", definition: "코드 block의 시작과 끝이 자원의 유효 범위를 명확히 결정하는 설계입니다.", detail: ["early return과 예외에서도 cleanup됩니다.", "자원 reference를 scope 밖에 누출하지 않습니다."] },
    ],
    codeExamples: [{
      id: "context-manager-cleanup-evidence",
      title: "정상·예외 경로에서 context cleanup이 정확히 한 번 실행됨을 확인합니다",
      language: "python",
      filename: "context_cleanup.py",
      purpose: "실제 파일 없이 contextmanager event trace로 acquire/use/release와 예외 전파 순서를 검증합니다.",
      code: String.raw`from contextlib import contextmanager

events = []

@contextmanager
def managed(name):
    events.append(f"acquire:{name}")
    try:
        yield name.upper()
    finally:
        events.append(f"release:{name}")

with managed("ok") as resource:
    events.append(f"use:{resource}")

try:
    with managed("fail") as resource:
        events.append(f"use:{resource}")
        raise LookupError("missing")
except LookupError as error:
    events.append(f"caught:{type(error).__name__}")

print("events:", events)`,
      walkthrough: [
        { lines: "1-11", explanation: "generator context manager의 acquire·yield·finally release 구조를 정의합니다." },
        { lines: "13-14", explanation: "정상 suite에서 use 뒤 release가 실행됩니다." },
        { lines: "16-21", explanation: "LookupError 경로에서도 release가 먼저 실행되고 바깥 handler가 예외를 잡습니다." },
        { lines: "23", explanation: "전체 ordering을 한 deterministic trace로 검증합니다." },
      ],
      run: { environment: ["Python 3.13+", "실제 filesystem/network 불필요"], command: "python -I -B -X utf8 context_cleanup.py" },
      output: { value: "events: ['acquire:ok', 'use:OK', 'release:ok', 'acquire:fail', 'use:FAIL', 'release:fail', 'caught:LookupError']", explanation: ["context manager는 예외를 suppress하지 않아 바깥 handler까지 전파됩니다.", "두 자원 모두 release event가 정확히 한 번 존재합니다."] },
      experiments: [
        { change: "finally를 제거합니다.", prediction: "fail 경로에서 release event가 누락됩니다.", result: "yield 이후 cleanup은 finally에 있어야 합니다." },
        { change: "LookupError를 context manager 내부에서 잡고 반환합니다.", prediction: "바깥 caught event가 사라집니다.", result: "suppress 정책은 명시적이어야 합니다." },
        { change: "acquire event 뒤 yield 전에 예외를 냅니다.", prediction: "yield 뒤 finally 구조에 도달하는 방식과 획득 상태를 재검토해야 합니다.", result: "부분 획득 cleanup을 acquire 구현 자체가 책임져야 합니다." },
      ],
      sourceRefs: ["python-with-statement", "python-contextlib-manager"],
    }],
    diagnostics: [
      { symptom: "early return·예외 때 connection이나 lock이 남는다.", likelyCause: "release를 정상 경로 마지막 줄에만 두고 자원 lifetime을 구조화하지 않았습니다.", checks: ["모든 return·raise 경로를 나열합니다.", "context manager 지원 여부를 확인합니다.", "acquire 실패와 use 실패를 분리합니다."], fix: "with/context manager 또는 최소 try/finally로 cleanup을 보장합니다.", prevention: "failure injection으로 정상·예외·취소 경로의 release 횟수를 검증합니다." },
    ],
    expertNotes: ["비동기 자원에는 async with protocol이 대응합니다. cancellation 중 cleanup shield·timeout 정책은 별도의 async 과정에서 다룹니다."],
  },
  {
    id: "traceback-chaining-groups-and-retry",
    title: "traceback·원인 chaining·ExceptionGroup과 retry 경계를 구조화합니다",
    lead: "원인을 보존한 domain 변환, 병렬 실패 묶음과 bounded retry는 서로 다른 실패 정보를 버리지 않고 적절한 layer에 전달하는 기술입니다.",
    explanations: [
      "raise NewError(...) from original은 __cause__를 명시하고 traceback에 직접 원인 관계를 표시합니다. from None은 사용자 화면에서 context를 숨길 수 있지만 내부 관찰성까지 삭제하지 않도록 원인을 기록합니다.",
      "traceback.TracebackException은 exception과 traceback을 저장·format하는 표준 표현입니다. 외부 응답에는 stack·path·secret을 노출하지 않고 내부 secure log에 correlation ID와 함께 남깁니다.",
      "ExceptionGroup은 독립 작업 여러 개가 동시에 실패했을 때 하나만 버리지 않고 묶습니다. except*는 matching 하위 예외 subgroup을 처리하고 나머지는 계속 전파합니다.",
      "retry는 timeout·일시 network 오류처럼 같은 operation을 다시 하면 성공할 가능성이 있는 실패만 대상으로 합니다. parse·permission·invariant 오류를 retry하면 latency와 부하만 키웁니다.",
      "retry에는 최대 시도, deadline, backoff+jitter, idempotency, 취소 전파와 마지막 cause가 필요합니다. broad Exception retry는 programmer bug까지 반복합니다.",
    ],
    concepts: [
      { term: "exception chaining", definition: "한 layer의 예외를 다른 의미의 예외로 변환하면서 원래 예외를 cause/context로 보존하는 기능입니다.", detail: ["raise ... from ...으로 명시합니다.", "debug와 domain abstraction을 함께 유지합니다."] },
      { term: "ExceptionGroup", definition: "여러 독립 예외를 tree 형태의 한 예외로 운반하는 container입니다.", detail: ["except*가 type별 subgroup을 처리합니다.", "parallel task 실패 보존에 적합합니다."] },
    ],
    codeExamples: [{
      id: "chaining-group-and-bounded-retry",
      title: "cause metadata·ExceptionGroup 분기·일시 오류 retry를 확인합니다",
      language: "python",
      filename: "advanced_exception_flow.py",
      purpose: "비결정 stack 문자열 대신 안정된 exception type·cause·attempt trace를 exact output으로 검증합니다.",
      code: String.raw`import traceback

class ConfigError(Exception):
    pass

try:
    try:
        int("not-a-number")
    except ValueError as error:
        raise ConfigError("invalid port") from error
except ConfigError as error:
    summary = traceback.TracebackException.from_exception(error)
    print("chain:", type(error).__name__, type(error.__cause__).__name__)
    print("traceback_type:", summary.exc_type_str)
    print("suppress_context:", error.__suppress_context__)

try:
    raise ExceptionGroup(
        "batch",
        [ValueError("bad"), TypeError("wrong"), OSError("offline")],
    )
except* ValueError as group:
    print("value_group:", len(group.exceptions))
except* (TypeError, OSError) as group:
    print("other_group:", [type(item).__name__ for item in group.exceptions])

outcomes = [TimeoutError("slow"), TimeoutError("slow"), "ok"]
attempts = []
for attempt in range(1, 4):
    attempts.append(attempt)
    outcome = outcomes[attempt - 1]
    try:
        if isinstance(outcome, Exception):
            raise outcome
    except TimeoutError:
        if attempt == 3:
            raise
    else:
        print("retry_result:", outcome)
        break
print("attempts:", attempts)`,
      walkthrough: [
        { lines: "1-15", explanation: "ValueError를 ConfigError로 명시 chaining하고 TracebackException에서 안정된 type metadata만 추출합니다." },
        { lines: "17-25", explanation: "세 하위 예외의 ExceptionGroup을 ValueError와 나머지 subgroup으로 나눠 모두 처리합니다." },
        { lines: "27-41", explanation: "TimeoutError만 최대 세 번 경계에서 재시도하고 세 번째 outcome 성공 시 else에서 종료합니다." },
      ],
      run: { environment: ["Python 3.13+", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 advanced_exception_flow.py" },
      output: { value: "chain: ConfigError ValueError\ntraceback_type: ConfigError\nsuppress_context: True\nvalue_group: 1\nother_group: ['TypeError', 'OSError']\nretry_result: ok\nattempts: [1, 2, 3]", explanation: ["raise ... from ...은 명시 cause 때문에 suppress_context가 True입니다.", "ExceptionGroup 하위 순서는 생성 순서를 보존합니다."] },
      experiments: [
        { change: "raise ConfigError만 사용해 from을 제거합니다.", prediction: "__cause__는 None이고 implicit __context__만 남습니다.", result: "명시 cause와 암시 context 차이를 확인합니다." },
        { change: "except* ValueError만 남깁니다.", prediction: "처리되지 않은 TypeError·OSError subgroup이 다시 발생합니다.", result: "except*가 matching 일부만 소비합니다." },
        { change: "ValueError도 retry 대상에 넣습니다.", prediction: "같은 invalid input을 반복해도 성공하지 않습니다.", result: "transient classification이 retry 전제입니다." },
      ],
      sourceRefs: ["python-traceback-doc", "python-exception-context", "python-exception-groups", "python-try-statement"],
    }],
    diagnostics: [
      { symptom: "domain error로 변환한 뒤 원래 stack과 실패 type을 알 수 없다.", likelyCause: "새 예외만 raise하고 cause chaining·내부 traceback 기록을 버렸습니다.", checks: ["__cause__와 __context__를 확인합니다.", "raise ... from ... 사용 여부를 봅니다.", "외부 응답과 내부 log를 분리합니다."], fix: "명시 exception chaining과 secure structured traceback logging을 사용합니다.", prevention: "cause 보존 test와 민감 정보 redaction test를 함께 둡니다." },
    ],
    expertNotes: ["ExceptionGroup handler에서 subgroup을 처리한 뒤 새 예외를 올릴 때 tree 형태가 달라질 수 있으므로 실제 async framework의 aggregation 규칙을 integration test로 고정합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "except Exception과 except BaseException의 중요한 차이는 무엇인가요?", answer: "Exception은 일반 application 오류 대부분을 잡지만 KeyboardInterrupt·SystemExit 같은 종료 신호는 제외하고, BaseException은 그것들까지 잡습니다." },
  { question: "try 범위를 왜 최소화해야 하나요?", answer: "같은 예외 type이라도 다른 코드에서 난 실패를 잘못된 의미로 분류·복구하는 일을 줄이기 위해서입니다." },
  { question: "else 절은 언제 실행되나요?", answer: "try suite가 예외 없이 끝나 어떤 except도 실행되지 않았을 때 실행됩니다." },
  { question: "context manager의 __exit__가 True를 반환하면 어떻게 되나요?", answer: "suite에서 전달된 예외를 처리한 것으로 간주해 suppress합니다." },
  { question: "raise NewError from original의 효과는 무엇인가요?", answer: "original을 명시적 __cause__로 보존하고 traceback에 직접 원인 관계를 표시합니다." },
  { question: "except*는 일반 except와 어떻게 다른가요?", answer: "ExceptionGroup tree에서 matching 하위 예외 subgroup만 선택해 처리하고 나머지는 계속 전파할 수 있습니다." },
  { question: "안전한 retry에 반드시 필요한 요소는 무엇인가요?", answer: "transient 분류, 최대 시도/deadline, backoff·jitter, idempotency, 취소 전파와 마지막 cause 보존이 필요합니다." },
);
session.completionChecklist.push(
  "BaseException·Exception과 주요 하위 예외 hierarchy를 구분한다.",
  "구체 handler를 상위 handler보다 먼저 두고 try 범위를 최소화한다.",
  "성공 후 처리를 else로 옮겨 예외 오분류를 막는다.",
  "cleanup을 with/context manager 또는 try/finally로 정확히 한 번 보장한다.",
  "domain 변환에서 raise ... from ...으로 원래 cause를 보존한다.",
  "ExceptionGroup을 except*로 type별 처리하고 미처리 subgroup 전파를 테스트한다.",
  "retry를 일시 오류에만 적용하고 deadline·idempotency·취소를 계약한다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "python-exception-hierarchy", repository: "Python documentation", path: "library/exceptions.html#exception-hierarchy", publicUrl: "https://docs.python.org/3/library/exceptions.html#exception-hierarchy", usedFor: ["BaseException", "Exception", "종료 신호"], evidence: "공식 exception hierarchy를 handler 범위와 분류 기준으로 사용했습니다." },
  { id: "python-handling-exceptions", repository: "Python documentation", path: "tutorial/errors.html#handling-exceptions", publicUrl: "https://docs.python.org/3/tutorial/errors.html#handling-exceptions", usedFor: ["except matching", "else", "handler 순서"], evidence: "공식 tutorial의 exception handling 흐름을 catch scope 설명에 사용했습니다." },
  { id: "python-try-statement", repository: "Python documentation", path: "reference/compound_stmts.html#the-try-statement", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-try-statement", usedFor: ["try/except/else/finally", "except*"], evidence: "공식 language reference의 try statement 실행 순서를 기준으로 사용했습니다." },
  { id: "python-with-statement", repository: "Python documentation", path: "reference/compound_stmts.html#the-with-statement", publicUrl: "https://docs.python.org/3/reference/compound_stmts.html#the-with-statement", usedFor: ["context protocol", "cleanup"], evidence: "공식 with statement 변환 규칙을 lexical resource lifetime 설명에 사용했습니다." },
  { id: "python-contextlib-manager", repository: "Python documentation", path: "library/contextlib.html#contextlib.contextmanager", publicUrl: "https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager", usedFor: ["generator context manager", "yield/finally"], evidence: "공식 contextmanager 문서의 generator 기반 acquire/release 계약을 확인했습니다." },
  { id: "python-traceback-doc", repository: "Python documentation", path: "library/traceback.html#traceback.TracebackException", publicUrl: "https://docs.python.org/3/library/traceback.html#traceback.TracebackException", usedFor: ["traceback 구조화", "exception type metadata"], evidence: "공식 TracebackException API를 안전한 metadata 추출 근거로 사용했습니다." },
  { id: "python-exception-context", repository: "Python documentation", path: "library/exceptions.html#exception-context", publicUrl: "https://docs.python.org/3/library/exceptions.html#exception-context", usedFor: ["__cause__", "__context__", "raise from"], evidence: "공식 exception context 문서의 명시·암시 chaining 계약을 확인했습니다." },
  { id: "python-exception-groups", repository: "Python documentation", path: "library/exceptions.html#exception-groups", publicUrl: "https://docs.python.org/3/library/exceptions.html#exception-groups", usedFor: ["ExceptionGroup", "subgroup 처리"], evidence: "공식 exception group 문서를 병렬 실패 보존과 except* 설명에 사용했습니다." },
);

export default session;
