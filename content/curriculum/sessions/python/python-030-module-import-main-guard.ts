import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-030"],
  slug: "python-030-module-import-main-guard",
  courseId: "python",
  moduleId: "03-oop-stdlib",
  order: 30,
  title: "모듈 import와 main guard",
  subtitle: "import가 파일 복사가 아니라 module 객체 생성과 top-level 실행이라는 사실을 이해하고, 재사용 가능한 library와 실행 entry point를 분리합니다.",
  level: "중급",
  estimatedMinutes: 145,
  coreQuestion: "같은 Python 파일을 다른 코드에서 안전하게 import하면서도 직접 실행·python -m·test·배포 환경에서 예측 가능한 시작점을 어떻게 만들까요?",
  summary: "module namespace·import 실행·sys.modules cache, import와 from import의 이름 binding, package와 absolute/relative import, sys.path·cwd·설치 환경을 연결합니다. main guard 유무에 따른 원본 Car 출력 부작용을 재현하고 __name__·__main__·python -m 차이를 격리 예제로 확인합니다. 순환 import·부분 초기화, import-time I/O·전역 singleton, 공개 API·resource loading·plugin 보안까지 운영 가능한 module 경계로 확장합니다.",
  objectives: [
    "module이 독립 namespace를 가진 객체이며 첫 import 때 top-level 문장이 실행되는 과정을 설명할 수 있다.",
    "import module과 from module import name이 호출부 namespace에 무엇을 bind하는지 구분할 수 있다.",
    "absolute·relative import와 package context, sys.path·cwd·설치 상태가 module 탐색에 미치는 영향을 진단할 수 있다.",
    "sys.modules cache 때문에 같은 process의 반복 import가 보통 module body를 다시 실행하지 않는다는 점을 확인할 수 있다.",
    "__name__ == '__main__' guard로 정의·실행 코드를 분리하고 직접 실행과 python -m을 목적에 맞게 선택할 수 있다.",
    "import-time 부수 효과와 순환 import의 부분 초기화 문제를 dependency 구조로 해결할 수 있다.",
    "package 공개 API·resource·configuration·plugin loading을 명시적이고 안전한 경계로 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "함수 계약·스코프·반환", reason: "module top-level 절차를 main 함수와 import 가능한 작은 함수로 분리합니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "경로·파일 모드·context manager", reason: "module 탐색 경로와 package resource 경로를 cwd 파일 경로와 구분합니다.", sessionSlug: "python-024-path-file-modes-context-manager" },
    { title: "클래스·객체·생성자", reason: "다른 module에서 Car class 정의를 import하고 객체 생성 시점과 module 실행 시점을 구분합니다.", sessionSlug: "python-028-class-object-constructor" },
  ],
  keywords: ["Python", "module", "package", "import", "sys.modules", "sys.path", "__name__", "__main__", "main guard", "python -m", "circular import", "import side effect"],
  chapters: [
    {
      id: "module-object-execution",
      title: "module은 파일 내용이 복사되는 것이 아니라 한 번 실행되어 namespace 객체가 됩니다",
      lead: "첫 import는 module spec을 찾고 객체를 만들어 cache에 등록한 뒤 top-level 코드를 실행해 이름을 채웁니다.",
      explanations: [
        "Python source 파일 하나는 보통 module 하나가 됩니다. import day06.ex03_class는 파일 text를 호출부에 붙여 넣지 않습니다. import system이 module 객체를 만들고 module의 global namespace에서 class Car와 다른 top-level 문장을 실행한 뒤 호출부 이름에 module을 bind합니다.",
        "def와 class 문도 top-level 실행의 일부입니다. def는 함수 body를 지금 실행하지 않지만 function 객체를 만들어 이름에 bind하고, class 문은 class body를 실행해 class 객체를 만듭니다. 반면 top-level print·파일 open·network 호출은 import 중 즉시 실행됩니다.",
        "module.__dict__에는 해당 module의 global 이름이 들어 있고 module.__name__, __file__, __package__, __spec__ 같은 metadata가 import 문맥을 설명합니다. 디버깅 때 repr(module)과 __spec__을 확인할 수 있지만 production 로직을 내부 metadata 우연에 과도하게 의존시키지 않습니다.",
        "module import가 실패하면 예외가 호출자에게 전파되고 부분 초기화 상태가 관련 오류 메시지에 나타날 수 있습니다. 단순히 'module 없음'만 가정하지 말고 module body 내부의 다른 예외도 traceback의 마지막 원인과 첫 project frame으로 구분합니다.",
      ],
      concepts: [
        { term: "module object", definition: "독립 global namespace와 import metadata를 가지며 Python code·extension·namespace package 등을 나타내는 runtime 객체입니다.", detail: ["이름은 attribute로 조회할 수 있습니다.", "보통 sys.modules에서 fully qualified name으로 cache됩니다."] },
        { term: "top-level code", definition: "함수·method 내부가 아니라 module import 또는 직접 실행 중 module namespace에서 실행되는 문장입니다.", detail: ["def·class 정의도 top-level 문장입니다.", "I/O·print·thread 시작은 import 부수 효과가 됩니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "import 문에서 오류가 났지만 대상 module 파일은 실제로 존재한다.", likelyCause: "module 탐색은 성공했지만 그 module의 top-level 실행 또는 하위 import에서 예외가 발생했습니다.", checks: ["traceback의 최초 예외 type과 project source 줄을 확인합니다.", "ModuleNotFoundError.name이 요청 module인지 내부 dependency인지 봅니다.", "대상 module을 격리 process에서 import해 side effect를 재현합니다."], fix: "module body 오류·dependency 누락·환경 설정을 실제 원인에 맞게 수정하고 import-time 작업을 명시 함수로 옮깁니다.", prevention: "모든 public module을 clean environment에서 import하는 smoke test와 import-time I/O 금지 규칙을 둡니다." },
      ],
    },
    {
      id: "import-forms-and-namespaces",
      title: "import 형태마다 호출부 namespace에 bind되는 이름과 결합도가 다릅니다",
      lead: "import package.module은 module 이름을 통해 출처를 남기고 from package.module import Car는 Car 이름을 직접 bind합니다.",
      explanations: [
        "import day06.ex03_class 뒤에는 day06 또는 alias로 module을 조회하고 day06.ex03_class.Car처럼 사용합니다. from day06.ex03_class import Car는 import 과정 자체는 수행하되 현재 module global에 Car를 직접 bind합니다. 둘 다 source module body 실행 가능성이 있습니다.",
        "from module import *는 __all__ 또는 underscore 규칙에 따라 많은 이름을 가져와 출처·충돌을 숨깁니다. 교육 shell 외 production code에서는 명시 import를 사용합니다. alias는 긴 이름을 줄이거나 충돌을 피하되 관례적인 np·pd처럼 팀이 이해할 수 있는 이름을 사용합니다.",
        "import한 이름은 그 시점의 객체 reference입니다. from settings import VALUE 뒤 source module.VALUE를 새 객체로 바꿔도 호출부 VALUE 이름은 자동 재bind되지 않습니다. 동적 설정은 module attribute를 조회하거나 명시 configuration object를 전달합니다.",
        "underscore는 내부 API 의도를 나타낼 뿐 완전한 접근 제어가 아닙니다. package __init__.py의 __all__과 facade import로 public surface를 좁힐 수 있지만 실제 호환성은 문서·semantic version·test로 관리합니다.",
      ],
      concepts: [
        { term: "namespace binding", definition: "import 결과 객체를 현재 module의 특정 이름에 연결하는 동작입니다.", detail: ["import form과 alias에 따라 이름이 달라집니다.", "객체 reference binding이지 source text 복사가 아닙니다."] },
        { term: "public API surface", definition: "package 사용자가 의존하도록 공식 지원하는 module·class·함수·상수 집합입니다.", detail: ["내부 파일 구조와 분리할 수 있습니다.", "재export와 __all__은 의도 표현 수단이지 보안 장벽은 아닙니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "import 뒤 같은 이름이 다른 module의 class·function으로 바뀌거나 어디서 왔는지 알 수 없다.", likelyCause: "여러 from import 또는 star import가 현재 namespace 이름을 덮었습니다.", checks: ["value.__module__·__qualname__을 확인합니다.", "동일 이름 import와 alias를 검색합니다.", "star import와 __all__을 확인합니다."], fix: "module-qualified 호출 또는 의미 있는 alias로 출처를 명시하고 star import를 제거합니다.", prevention: "import order를 formatter로 통일하고 lint의 wildcard·redefined-name 규칙을 사용합니다." },
      ],
    },
    {
      id: "resolution-packages-sys-path",
      title: "module 탐색은 package 이름과 sys.path를 사용하며 cwd 파일 상대경로와 다른 문제입니다",
      lead: "파일이 disk에 있다는 사실만으로 import 가능한 것은 아니며 package root가 module search path에 있어야 합니다.",
      explanations: [
        "from day06.ex03_class import Car가 성공하려면 day06을 포함한 프로젝트 root가 sys.path에 있어야 합니다. 프로젝트 root에서 python -m day06.ex04_class를 실행하면 root가 search path에 들어가지만 day06 안에서 python ex04_class.py로 직접 실행하면 package context와 search path가 달라질 수 있습니다.",
        "sys.path에는 script directory, current environment의 site-packages, PYTHONPATH 등 여러 source가 들어갑니다. 코드 안에서 sys.path.append로 우연히 고치면 배포·test 순서에 따라 다른 package를 import할 수 있습니다. project를 editable install하거나 pyproject 기반 package로 설치하고 entry point를 사용합니다.",
        "absolute import는 top-level package에서 경로를 적고 relative import는 package 내부에서 .·..로 현재 package를 기준 삼습니다. relative import가 있는 파일을 경로로 직접 실행하면 known parent package가 없어 실패할 수 있어 python -m package.module을 사용합니다.",
        "project 파일 이름을 json.py, typing.py, requests.py처럼 표준·외부 package와 같게 만들면 search path 앞의 local 파일이 실제 package를 shadowing합니다. module.__file__과 spec.origin을 확인하고 충돌 이름을 바꿉니다.",
      ],
      concepts: [
        { term: "sys.path", definition: "import system이 top-level module·package를 찾을 때 순서대로 검색하는 경로 목록입니다.", detail: ["실행 방식과 environment에 따라 달라집니다.", "production 코드에서 임의 수정하기보다 package 설치를 사용합니다."] },
        { term: "package context", definition: "현재 module의 fully qualified 이름과 parent package 정보로 relative import와 python -m 실행을 해석하는 문맥입니다.", detail: ["__package__·__spec__에 반영됩니다.", "파일 경로 직접 실행은 package 문맥을 잃을 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "package-module-execution",
          title: "임시 package를 python -m으로 실행해 relative import 유지",
          language: "python",
          filename: "run_package_demo.py",
          purpose: "실제 파일을 격리 생성하고 package module entry point와 relative import 결과를 subprocess에서 확인합니다.",
          code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\nimport subprocess\nimport sys\n\nwith TemporaryDirectory() as temp_dir:\n    root = Path(temp_dir)\n    package = root / 'studyapp'\n    package.mkdir()\n    (package / '__init__.py').write_text('', encoding='utf-8')\n    (package / 'messages.py').write_text(\n        \"def greeting(name):\\n    return f'안녕, {name}'\\n\",\n        encoding='utf-8',\n    )\n    (package / 'cli.py').write_text(\n        \"from .messages import greeting\\n\"\n        \"def main():\\n    print(greeting('둘리'))\\n\"\n        \"if __name__ == '__main__':\\n    main()\\n\",\n        encoding='utf-8',\n    )\n\n    result = subprocess.run(\n        [sys.executable, '-m', 'studyapp.cli'],\n        cwd=root, text=True, capture_output=True, check=True,\n    )\n    print(result.stdout.strip())\n    print(f'stderr-empty={not result.stderr}')",
          walkthrough: [
            { lines: "1-9", explanation: "TemporaryDirectory에 __init__.py가 있는 실제 studyapp package를 만들어 현재 프로젝트를 오염시키지 않습니다." },
            { lines: "10-14", explanation: "messages module에 한글 greeting function을 작성합니다." },
            { lines: "15-21", explanation: "cli module은 .messages relative import, main 함수, main guard를 가집니다." },
            { lines: "23-27", explanation: "temporary root를 cwd로 두고 현재 Python executable의 -m 옵션으로 fully qualified module을 실행해 package context를 유지합니다." },
            { lines: "26-27", explanation: "stdout 결과와 stderr가 비었음을 안정적으로 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "run_package_demo.py로 저장"], command: "python run_package_demo.py" },
          output: { value: "안녕, 둘리\nstderr-empty=True", explanation: ["python -m이 studyapp.cli를 __main__으로 실행해 guard의 main이 호출됩니다.", ".messages는 studyapp package context에서 정상 해석됩니다.", "격리 package root를 subprocess cwd로 명시해 search path를 예측 가능하게 했습니다."] },
          experiments: [
            { change: "subprocess 명령을 [python, package/'cli.py'] 직접 경로 실행으로 바꿉니다.", prediction: "parent package를 알 수 없어 attempted relative import with no known parent package 오류가 납니다.", result: "package 내부 relative import entry point에는 -m 또는 설치된 console script가 적합합니다." },
            { change: "root에 studyapp.py 파일도 만듭니다.", prediction: "package와 module 이름 충돌로 resolution이 예상과 달라질 수 있습니다.", result: "top-level import 이름을 고유하게 정하고 spec.origin을 진단해야 합니다." },
          ],
          sourceRefs: ["py-import-class-source", "python-import-doc"],
        },
      ],
      diagnostics: [
        { symptom: "ModuleNotFoundError 또는 attempted relative import with no known parent package가 실행 방식에 따라 발생한다.", likelyCause: "package 내부 파일을 경로로 직접 실행해 parent package context가 없거나 package root가 sys.path에 없습니다.", checks: ["module.__package__와 sys.path[0]을 정상·실패 실행에서 비교합니다.", "python -m package.module로 재현합니다.", "활성 virtual environment에 project가 설치됐는지 확인합니다."], fix: "package root에서 -m으로 실행하거나 project를 설치하고 console entry point를 사용합니다. sys.path 임의 수정은 제거합니다.", prevention: "CI에서 설치된 package entry point와 -m 실행을 검증하고 내부 module 직접 경로 실행을 문서에서 피합니다." },
      ],
    },
    {
      id: "cache-and-import-side-effects",
      title: "첫 import 실행 결과는 sys.modules에 cache되고 import-time 부수 효과는 process 상태가 됩니다",
      lead: "같은 fully qualified 이름을 반복 import하면 보통 같은 module 객체를 돌려주므로 body가 매번 다시 실행되지 않습니다.",
      explanations: [
        "import system은 실행 전에 module을 sys.modules[name]에 넣어 recursive import를 관리하고 성공 후 같은 객체를 재사용합니다. 같은 process에서 import module을 두 번 적어도 top-level print는 보통 한 번입니다. 다른 process를 시작하면 cache가 새로 생기므로 다시 실행됩니다.",
        "원본 ex05는 main guard가 없어 Car 생성과 여러 print가 import 시 실행됩니다. ex06은 Car class만 가져오려 하지만 ex05 body 전체 출력이 먼저 발생합니다. import가 성공했다는 사실과 안전하게 재사용 가능하다는 사실은 다릅니다.",
        "import-time DB 연결·network 요청·thread 시작·환경 필수 검증은 test discovery와 CLI help까지 실패시킬 수 있습니다. module body에는 값싼 정의와 불변 metadata를 두고 expensive·fallible 작업은 main, application factory, lazy provider로 옮깁니다.",
        "importlib.reload는 기존 module 객체 namespace에서 code를 다시 실행하지만 from-import된 다른 이름·기존 instance class identity·resource cleanup이 자동 갱신되지 않습니다. production hot reload 수단으로 단순 사용하지 않고 개발 도구도 lifecycle을 명시합니다.",
      ],
      concepts: [
        { term: "sys.modules cache", definition: "현재 process에서 fully qualified module 이름을 이미 생성된 module 객체에 매핑하는 import cache입니다.", detail: ["반복 import의 body 재실행을 막습니다.", "부분 초기화 module도 순환 import 중 잠시 보일 수 있습니다."] },
        { term: "import side effect", definition: "이름 정의 외에 import만으로 발생하는 출력·I/O·전역 등록·thread 시작·환경 변경 같은 관찰 가능한 동작입니다.", detail: ["작고 의도된 registry 등록도 lifecycle을 문서화해야 합니다.", "실패 가능한 외부 작업은 명시 시작 함수로 옮깁니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "test 수집이나 단순 import만 했는데 로그 출력·파일 생성·network 연결이 발생한다.", likelyCause: "module top-level에 실행 절차가 있고 main guard 또는 명시 initialization 경계가 없습니다.", checks: ["AST·source에서 top-level call과 객체 생성을 찾습니다.", "python -c 'import target'을 격리 환경에서 실행합니다.", "하위 import까지 stdout·파일·network를 추적합니다."], fix: "정의와 side effect를 분리해 main·create_app·connect 함수로 옮기고 import 자체는 값싸고 결정적으로 만듭니다.", prevention: "import smoke test에서 stdout/stderr·network·파일 변경이 없음을 검증합니다." },
      ],
    },
    {
      id: "main-guard-entry-points",
      title: "main guard는 재사용 정의와 직접 실행 절차를 같은 파일에서 분리합니다",
      lead: "파일이 top-level script로 실행되면 __name__은 '__main__'이고 일반 import면 fully qualified module 이름입니다.",
      explanations: [
        "원본 ex03은 Car class를 정의하고 if __name__ == '__main__' 안에서만 객체를 만들고 출력합니다. ex04가 Car를 import할 때 ex03의 demo 출력은 실행되지 않고 ex04가 명시한 출력만 나옵니다. 반대로 ex05에는 guard가 없어 ex06의 import만으로 demo가 노출됩니다.",
        "guard 안에 긴 업무 로직을 직접 쓰기보다 def main(argv=None) -> int 함수로 만들고 guard에서 raise SystemExit(main())을 호출합니다. parsing·core 함수는 import해 test할 수 있고 exit code는 shell·CI 계약이 됩니다.",
        "python file.py 직접 실행은 그 파일을 __main__ module로 실행하고 script directory를 search path에 둡니다. python -m package.module은 package resolution 후 해당 module code를 __main__으로 실행하므로 relative import가 유지됩니다. 설치 package는 console_scripts entry point로 main 함수를 연결할 수 있습니다.",
        "main guard는 process가 module을 두 경로로 중복 import하는 모든 문제를 자동 해결하지 않습니다. 실행 파일이 자신의 package 이름으로 다시 import되면 __main__ module과 package.module 두 객체가 생겨 class identity·singleton이 중복될 수 있습니다. entry point는 package 내부 module을 import하고 main만 호출하도록 얇게 유지합니다.",
      ],
      concepts: [
        { term: "__main__", definition: "현재 interpreter에서 top-level 실행 대상으로 선택된 module에 주어지는 특별 이름이자 entry module입니다.", detail: ["직접 파일 실행과 -m 실행 모두 대상 module의 __name__을 '__main__'으로 둡니다.", "일반 import의 __name__은 package를 포함한 module 이름입니다."] },
        { term: "main guard", definition: "if __name__ == '__main__': 조건으로 일반 import 때 실행하지 않을 CLI·demo 시작 절차를 제한하는 패턴입니다.", detail: ["정의와 실행을 분리합니다.", "import 부수 효과 전체를 자동 제거하지는 않습니다."] },
      ],
      codeExamples: [
        {
          id: "direct-vs-import-main-guard",
          title: "같은 module을 직접 실행하고 import해 body·main 차이 비교",
          language: "python",
          filename: "main_guard_demo.py",
          purpose: "임시 tool module을 subprocess에서 직접 실행·import해 top-level body와 guard 영역의 실행 횟수를 확인합니다.",
          code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\nimport subprocess\nimport sys\n\nwith TemporaryDirectory() as temp_dir:\n    root = Path(temp_dir)\n    tool = root / 'tool.py'\n    tool.write_text(\n        \"print(f'body:{__name__}')\\n\"\n        \"def main():\\n    print('main-called')\\n\"\n        \"if __name__ == '__main__':\\n    main()\\n\",\n        encoding='utf-8',\n    )\n\n    direct = subprocess.run(\n        [sys.executable, str(tool)],\n        text=True, capture_output=True, check=True,\n    )\n    imported = subprocess.run(\n        [sys.executable, '-c', 'import tool; import tool; print(\"runner-done\")'],\n        cwd=root, text=True, capture_output=True, check=True,\n    )\n\n    print('DIRECT')\n    print(direct.stdout.strip())\n    print('IMPORTED')\n    print(imported.stdout.strip())",
          walkthrough: [
            { lines: "1-7", explanation: "격리 경로와 tool.py를 준비합니다." },
            { lines: "8-13", explanation: "tool body는 언제나 __name__을 한 번 출력하고 main 함수 정의 뒤 guard가 참일 때만 main-called를 출력합니다." },
            { lines: "16-19", explanation: "첫 subprocess는 파일을 직접 실행해 tool의 __name__이 __main__입니다." },
            { lines: "20-23", explanation: "두 번째 process는 같은 module을 두 번 import하지만 sys.modules cache로 body는 한 번이고 guard는 거짓입니다." },
            { lines: "25-28", explanation: "두 process 출력을 label과 함께 비교합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "main_guard_demo.py로 저장"], command: "python main_guard_demo.py" },
          output: { value: "DIRECT\nbody:__main__\nmain-called\nIMPORTED\nbody:tool\nrunner-done", explanation: ["직접 실행은 body와 guard main을 모두 실행합니다.", "import는 body 정의를 실행하지만 main guard를 건너뜁니다.", "같은 process의 두 번째 import는 cached tool을 재사용해 body를 다시 출력하지 않습니다."] },
          experiments: [
            { change: "guard를 제거하고 main()을 top-level에서 직접 호출합니다.", prediction: "import process에서도 main-called가 출력됩니다.", result: "재사용 module의 실행 절차가 import side effect가 됩니다." },
            { change: "importlib.reload(tool)을 추가합니다.", prediction: "tool body가 다시 실행되어 body:tool이 한 번 더 출력되지만 main guard는 계속 거짓입니다.", result: "reload는 일반 반복 import와 다른 명시적 재실행입니다." },
          ],
          sourceRefs: ["py-main-guard-source", "py-import-side-effect-source", "python-main-doc"],
        },
      ],
      diagnostics: [
        { symptom: "module을 import했을 뿐인데 demo·CLI가 실행되거나 process가 종료된다.", likelyCause: "실행 절차가 main guard 밖 top-level에 있거나 import 중 SystemExit를 발생시킵니다.", checks: ["module 하단의 객체 생성·main 호출·SystemExit를 확인합니다.", "__name__ 값을 직접 실행·import에서 비교합니다.", "하위 import가 side effect를 만드는지 격리합니다."], fix: "CLI 절차를 main 함수로 옮기고 guard에서만 호출하며 library code는 process exit 대신 예외·반환으로 계약합니다.", prevention: "import만 하는 test와 main(argv) unit test, CLI subprocess integration test를 분리합니다." },
      ],
    },
    {
      id: "circular-imports",
      title: "순환 import는 부분 초기화 module을 노출하므로 dependency 방향을 다시 설계합니다",
      lead: "A가 B를 import하고 B가 A를 import하면 A body가 끝나기 전에 B가 cache의 미완성 A를 조회할 수 있습니다.",
      explanations: [
        "sys.modules에 module을 실행 전에 넣는 것은 무한 재귀를 막지만 모든 이름이 준비됐다는 뜻은 아닙니다. B가 아직 정의되지 않은 A.SomeClass를 조회하면 partially initialized module 관련 ImportError·AttributeError가 납니다.",
        "함수 안 local import로 실행 시점을 늦추면 일부 cycle을 끊을 수 있지만 dependency 설계가 숨겨지고 매 호출 lookup이 생깁니다. optional heavy dependency·typing cycle처럼 근거가 있을 때 제한적으로 사용합니다.",
        "공유 type·constant·Protocol을 세 번째 낮은 계층 module로 옮기고 A와 B가 그 module에 의존하게 하면 방향이 단방향이 됩니다. service orchestration은 상위 module이 두 하위 component를 조합합니다.",
        "type hint 때문에 생긴 cycle은 from __future__ import annotations, TYPE_CHECKING guard, 문자열 annotation을 사용할 수 있습니다. runtime에 실제 class가 필요한지 정적 도구만 필요한지 구분합니다.",
      ],
      concepts: [
        { term: "circular import", definition: "두 개 이상의 module import dependency가 cycle을 만들어 초기화 중 서로를 다시 요구하는 구조입니다.", detail: ["부분 초기화 namespace 오류가 날 수 있습니다.", "dependency inversion·공유 contract 추출로 해결합니다."] },
        { term: "partially initialized module", definition: "sys.modules에는 등록됐지만 top-level body 실행이 아직 끝나 모든 이름이 준비되지 않은 module 상태입니다.", detail: ["cycle 중 관찰될 수 있습니다.", "import 순서에 따라 증상이 달라져 보일 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "cannot import name ... from partially initialized module 또는 import 순서에 따른 AttributeError가 난다.", likelyCause: "module dependency cycle에서 상대 module의 이름이 정의되기 전에 조회됩니다.", checks: ["A→B→...→A import graph를 그립니다.", "각 module top-level에서 상대 attribute를 언제 읽는지 확인합니다.", "type hint만 필요한 import인지 분류합니다."], fix: "공유 Protocol·model을 낮은 독립 module로 추출하거나 상위 composition root가 양쪽을 조합하게 합니다. type-only cycle은 TYPE_CHECKING으로 분리합니다.", prevention: "architecture dependency rule과 import graph cycle check를 CI에 두고 module top-level orchestration을 피합니다." },
      ],
    },
    {
      id: "production-module-boundaries",
      title: "module 경계는 configuration·resource·plugin·관찰성을 명시적으로 소유해야 합니다",
      lead: "import가 어디서나 성공하고 같은 public API를 제공하려면 cwd와 import-time 외부 상태에 의존하지 않아야 합니다.",
      explanations: [
        "package에 포함된 template·data 파일을 Path.cwd나 __file__ 문자열 조합으로 찾기보다 importlib.resources를 사용하면 wheel·zip 등 distribution 형태에서도 resource abstraction을 유지할 수 있습니다. 사용자 writable data는 package resource와 분리합니다.",
        "환경 변수·secret을 module import 시 읽어 global singleton을 만들면 test마다 환경을 바꿔도 cache된 값이 남습니다. create_settings·create_app에서 명시적으로 읽고 object를 dependency로 전달합니다. 필수 설정 오류는 application 시작 경계에서 field 이름만 보고하고 secret 값은 숨깁니다.",
        "사용자 문자열을 importlib.import_module에 그대로 전달하면 arbitrary installed module code를 실행할 수 있습니다. plugin은 허용 ID→entry point/factory whitelist와 version·signature·권한 검증을 사용하고 신뢰되지 않은 code는 별도 process·sandbox가 필요합니다.",
        "import 시간을 측정하고 무거운 dependency는 실제 필요 지점 또는 optional feature boundary로 이동할 수 있습니다. 그러나 lazy import가 첫 요청 latency·동시 초기화·오류 지연을 만들 수 있으므로 startup warm-up과 thread safety를 함께 설계합니다.",
      ],
      concepts: [
        { term: "composition root", definition: "application entry에서 configuration과 concrete dependency를 생성해 component를 조립하는 명시적 시작 경계입니다.", detail: ["library module의 import-time singleton을 줄입니다.", "main·web app factory·worker bootstrap이 될 수 있습니다."] },
        { term: "plugin entry point", definition: "설치 distribution이 정해진 group과 이름으로 factory를 등록해 host가 발견할 수 있게 하는 package metadata 기반 확장 지점입니다.", detail: ["발견 가능하다는 사실은 신뢰 가능하다는 뜻이 아닙니다.", "allowlist·version·격리 정책이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        { title: "Python 코드를 어떻게 시작할까요?", options: [
          { name: "python file.py", chooseWhen: "독립 단일 script거나 package relative import가 필요 없는 진입 파일일 때", avoidWhen: "package 내부 module을 파일 경로로 직접 실행할 때", tradeoffs: ["간단하고 즉시 실행됩니다.", "script directory가 import 기준이 됩니다.", "같은 module 중복 identity에 주의합니다."] },
          { name: "python -m package.module", chooseWhen: "설치·project root의 package 문맥과 relative import를 유지해 module entry를 실행할 때", avoidWhen: "사용자가 기억할 안정 CLI 이름을 제공해야 할 때", tradeoffs: ["package resolution을 사용합니다.", "cwd/search path·설치 상태가 필요합니다.", "대상 __name__은 __main__입니다."] },
          { name: "설치 console entry point", chooseWhen: "배포 package가 안정된 CLI command를 제공할 때", avoidWhen: "아직 package metadata 없는 일회성 학습 script일 때", tradeoffs: ["사용자가 module 경로를 몰라도 됩니다.", "build·install metadata가 필요합니다.", "main 함수와 exit code 계약을 명시할 수 있습니다."] },
        ] },
      ],
      expertNotes: ["subinterpreter·multiprocessing spawn에서는 module import와 global 초기화가 process/interpreter마다 다시 일어날 수 있으므로 sys.modules cache를 시스템 전체 singleton으로 오해하지 않습니다.", "supply-chain 공격을 줄이려면 dependency lock·hash·trusted index와 package 이름 typo 방어를 사용하고 import origin을 민감 경로 없이 관찰합니다."],
    },
  ],
  lab: {
    title: "재사용 가능한 학습 통계 package와 CLI entry point",
    scenario: "CSV 학습 기록을 분석하는 package를 library import, python -m 실행, 자동 test에서 부수 효과 없이 공통 사용하도록 구조화합니다.",
    setup: ["study_stats/에 __init__.py, models.py, analysis.py, cli.py, __main__.py를 만듭니다.", "pyproject 설정을 추가할 수 있지만 실제 외부 배포는 하지 않습니다.", "TemporaryDirectory의 합성 CSV만 사용합니다."],
    steps: ["models와 analysis에는 class·순수 함수 정의만 두고 import 시 print·파일 open을 하지 않습니다.", "cli.main(argv=None)->int가 argparse·파일 I/O·오류 표시를 소유하게 합니다.", "__main__.py는 from .cli import main 뒤 SystemExit(main())만 수행합니다.", "package __init__에는 안정 public API만 재export하고 내부 helper를 노출하지 않습니다.", "analysis→models 단방향 dependency를 만들고 cli가 둘을 조합해 cycle을 피합니다.", "python -m study_stats와 library import 두 subprocess를 실행해 출력·exit code를 검증합니다.", "같은 process에서 package를 두 번 import해 module body side effect가 없음을 확인합니다.", "cwd를 두 위치로 바꿔도 설치/editable package와 명시 입력 경로가 동작하는지 테스트합니다.", "잘못된 plugin 이름·누락 configuration·민감 path 로그 정책을 추가합니다."],
    expectedResult: ["library import는 stdout·파일·network side effect가 없습니다.", "python -m 실행만 CLI 결과를 출력하고 의미 있는 exit code를 반환합니다.", "relative import와 public API가 cwd 변경에도 안정적입니다.", "순환 import 없이 dependency 방향이 한눈에 보입니다.", "test가 main 함수를 직접 호출할 수 있고 CLI subprocess test는 별도입니다.", "외부 문자열이 임의 module import로 이어지지 않습니다."],
    cleanup: ["TemporaryDirectory와 합성 data를 삭제합니다.", "editable install을 사용했다면 격리 virtual environment만 제거합니다."],
    extensions: ["console script entry point를 pyproject에 등록합니다.", "importlib.resources로 package sample schema를 읽습니다.", "entry point 기반 reporter plugin을 allowlist와 conformance test로 추가합니다.", "import time profile과 lazy optional dependency 정책을 작성합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex03·ex04와 ex05·ex06 import 결과를 비교하세요.", requirements: ["각 파일의 직접 실행과 import에서 __name__·stdout을 기록합니다.", "guard 있는 ex03 demo가 import에서 실행되지 않음을 확인합니다.", "guard 없는 ex05 출력이 ex06 import 중 발생함을 확인합니다.", "같은 process에서 두 번 import해 cache 결과를 봅니다.", "Car class의 __module__을 출력합니다."], hints: ["subprocess로 실행을 격리하면 sys.modules cache를 통제할 수 있습니다.", "stdout line을 정의·실행 source별로 표시합니다."], expectedOutcome: "import가 module body 실행이고 main guard가 entry 절차만 제한한다는 사실을 재현합니다.", solutionOutline: ["원본을 변경 없이 각 방식으로 실행합니다.", "출력 표를 만듭니다.", "top-level 정의와 side effect 줄을 분류합니다."] },
    { difficulty: "응용", prompt: "세 파일짜리 계산 package를 import-safe CLI로 리팩터링하세요.", requirements: ["core module에는 순수 함수만 둡니다.", "cli.main(argv)->int와 __main__.py를 만듭니다.", "absolute·relative import 중 선택 근거를 적습니다.", "cwd 두 곳에서 -m 실행과 import test를 통과합니다.", "ModuleNotFoundError와 domain 오류 exit code를 구분합니다."], hints: ["package 내부 파일 경로 직접 실행을 entry로 삼지 않습니다.", "main guard 안에는 main 호출만 남깁니다."], expectedOutcome: "library와 CLI가 같은 core를 공유하되 import side effect가 없는 package를 만듭니다." },
    { difficulty: "설계", prompt: "서드파티 분석 plugin을 발견·적재하는 architecture를 설계하세요.", requirements: ["entry point group과 public Protocol·version을 정의합니다.", "사용자 입력 module 경로 직접 import를 금지하고 allowlist를 둡니다.", "import 실패·부분 초기화·cycle·느린 import를 격리합니다.", "plugin process 권한·timeout·memory·network 정책을 포함합니다.", "conformance test·dependency lock·audit log를 설계합니다.", "secret과 절대 import path를 오류 로그에서 마스킹합니다."], hints: ["설치됨과 신뢰됨은 다릅니다.", "module import 자체가 code execution입니다."], expectedOutcome: "import system을 확장성뿐 아니라 supply-chain·격리·관찰성 경계로 설계합니다." },
  ],
  reviewQuestions: [
    { question: "import는 source 파일 내용을 호출부에 복사하나요?", answer: "아닙니다. module 객체와 namespace를 만들고 top-level code를 실행한 뒤 객체를 이름에 bind합니다." },
    { question: "같은 process에서 같은 module을 두 번 import하면 body가 두 번 실행되나요?", answer: "보통 sys.modules에 cached된 같은 객체를 재사용해 두 번째 일반 import에서는 다시 실행하지 않습니다." },
    { question: "main guard가 참인 경우는 언제인가요?", answer: "해당 module이 현재 interpreter의 top-level 실행 대상이 되어 __name__이 '__main__'일 때입니다." },
    { question: "python package/module.py와 python -m package.module의 중요한 차이는 무엇인가요?", answer: "-m은 package resolution과 context를 유지해 relative import가 작동하지만 파일 직접 실행은 script로 취급될 수 있습니다." },
    { question: "guard가 있으면 모든 import 부수 효과가 사라지나요?", answer: "아닙니다. guard 밖 top-level call·하위 module import side effect는 계속 실행됩니다." },
    { question: "from module import VALUE 뒤 module.VALUE가 바뀌면 local VALUE도 자동으로 바뀌나요?", answer: "이름이 같은 객체를 가리키던 시점 이후 module.VALUE 재binding은 local VALUE를 자동 재binding하지 않습니다." },
    { question: "순환 import에서 partially initialized 오류가 나는 이유는 무엇인가요?", answer: "module이 cache에 등록됐지만 body 실행이 끝나기 전에 상대 module이 아직 정의되지 않은 이름을 조회하기 때문입니다." },
    { question: "외부 문자열을 import_module에 그대로 넣으면 왜 위험한가요?", answer: "import는 module top-level code execution이므로 공격자가 임의 설치 module을 선택할 수 있어 allowlist와 격리가 필요합니다." },
  ],
  completionChecklist: [
    "module 객체·namespace·top-level 실행 과정을 설명할 수 있다.",
    "import module·from import·alias의 binding 결과를 구분할 수 있다.",
    "sys.path·package context·shadowing을 사용해 import 실패를 진단할 수 있다.",
    "sys.modules cache와 import-time side effect의 process 수명을 설명할 수 있다.",
    "main 함수·guard·python -m·console entry point를 목적에 맞게 선택할 수 있다.",
    "순환 import graph를 찾아 shared contract 추출·dependency inversion으로 끊을 수 있다.",
    "import-safe configuration·resource·public API 경계를 설계할 수 있다.",
    "plugin import에 allowlist·version·격리·supply-chain 정책을 적용할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-import-class-source", repository: "PYTHON-BASIC", path: "day06/ex04_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex04_class.py", usedFor: ["from package.module import Car", "imported class 생성", "module 경계"], evidence: "프로젝트 root에서 python -m day06.ex04_class를 실행해 ex03의 guarded demo 없이 ex04의 red·35·3000과 forward/stop/back 출력만 발생함을 확인했습니다." },
    { id: "py-main-guard-source", repository: "PYTHON-BASIC", path: "day06/ex03_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex03_class.py", usedFor: ["Car 정의", "__name__ guard", "직접 실행 demo 분리"], evidence: "Car class와 if __name__ == '__main__' 아래 객체 생성·출력을 감사해 import-safe 정의의 기준으로 사용했습니다." },
    { id: "py-import-side-effect-source", repository: "PYTHON-BASIC", path: "day06/ex05_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex05_class.py", usedFor: ["guard 없는 module", "top-level 객체 생성", "import 출력 부수 효과"], evidence: "격리 process에서 import만 해도 자동차 정보와 30km method 출력 전체가 발생함을 확인했습니다." },
    { id: "py-import-consumer-source", repository: "PYTHON-BASIC", path: "day06/ex06_class.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day06/ex06_class.py", usedFor: ["하위 import 부수 효과 전파", "main guard 필요"], evidence: "ex06 import가 ex05의 top-level 출력 전체를 먼저 실행한 뒤 import-complete로 진행됨을 확인했습니다." },
    { id: "python-import-doc", repository: "Python documentation", path: "reference/import.html", publicUrl: "https://docs.python.org/3/reference/import.html", usedFor: ["import system", "module cache", "spec", "package", "search"], evidence: "공식 import system reference를 module 생성·sys.modules·loading·package resolution 설명의 기준으로 사용했습니다." },
    { id: "python-main-doc", repository: "Python documentation", path: "library/__main__.html", publicUrl: "https://docs.python.org/3/library/__main__.html", usedFor: ["__main__", "main guard", "-m", "package entry"], evidence: "공식 __main__ 문서를 직접 실행·import·-m entry point 선택의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["pyproject build backend·wheel publish·dependency resolution 전체는 가상환경/패키징 세션 py-040에서 확장합니다.", "sys.modules·순환 import·importlib.resources·plugin supply-chain은 원본 main guard 예제를 전문가 module architecture로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;

const advancedImportChapters: DetailedSession["chapters"] = [
  {
    id: "module-spec-resolution-cache-reload",
    title: "import를 resolve→spec→module creation→execution→sys.modules cache 단계로 추적합니다",
    lead: "같은 이름을 두 번 import할 때 파일을 두 번 실행하지 않는 이유와 shadowing·partial initialization을 이해하려면 name binding보다 import machinery lifecycle을 봐야 합니다.",
    explanations: [
      "import는 먼저 fully qualified name을 정하고 `sys.modules` cache를 확인합니다. 없으면 meta path finders가 ModuleSpec을 찾고 loader가 module object를 준비·실행한 뒤 cache와 importing namespace에 binding합니다.",
      "module code는 첫 정상 import에서 위에서 아래로 실행됩니다. function·class definition도 실행되어 이름을 만들고 module-level print·network·file access도 즉시 일어납니다. import-safe library는 정의와 cheap constants 위주로 두고 startup side effect는 main/composition root로 옮깁니다.",
      "두 번째 import는 보통 sys.modules의 같은 module object를 반환해 top-level code를 다시 실행하지 않습니다. singleton cache·registry·mutable module globals도 같은 object를 공유하므로 test isolation과 process lifecycle을 명시합니다.",
      "import가 실행 중 실패하면 partially initialized module과 이미 실행된 dependency side effect가 남을 수 있습니다. broad retry보다 root exception을 고치고 process/test state를 새로 시작하며 idempotent cleanup을 설계합니다.",
      "`importlib.reload(module)`은 기존 module object의 dictionary를 재사용하며 외부에서 `from mod import name`으로 복사한 binding을 자동 갱신하지 않습니다. production hot reload 도구로 단순 가정하지 말고 개발·plugin lifecycle을 별도 설계합니다.",
      "현재 directory나 프로젝트 파일이 `json.py`, `typing.py`, `csv.py` 같은 표준 모듈 이름을 shadow하면 예상하지 않은 spec이 선택됩니다. `module.__spec__`, `__file__`, `importlib.util.find_spec`로 실제 origin을 확인하되 로컬 절대 경로를 공개 로그에 노출하지 않습니다.",
      "`-I` isolated mode는 current working directory와 사용자 site 등 일부 환경 영향을 제거해 예제 재현성을 높이지만 설치된 package와 application entrypoint 조건을 대신하지 않습니다. CI에서는 wheel을 설치해 import하는 test도 수행합니다.",
    ],
    concepts: [
      { term: "ModuleSpec", definition: "module의 이름·loader·origin·package 정보 등 import machinery가 load에 사용하는 명세 객체입니다.", detail: ["module.__spec__에 연결됩니다.", "finders가 생성합니다."] },
      { term: "module cache", definition: "fully qualified name에서 이미 생성된 module object로 연결하는 sys.modules mapping입니다.", detail: ["같은 process import를 재사용합니다.", "partial initialization과 state 공유에 주의합니다."] },
      { term: "import side effect", definition: "module top-level 실행 중 이름 정의 외에 발생하는 출력·I/O·등록·상태 변경입니다.", detail: ["첫 import 시간에 발생합니다.", "최소화하고 entrypoint로 옮깁니다."] },
    ],
    codeExamples: [{
      id: "python-import-cache-spec-side-effect",
      title: "임시 module을 두 번 import해 실행 횟수·identity·spec·cache를 확인합니다",
      language: "python",
      filename: "import_cache_trace.py",
      purpose: "module top-level side effect는 한 번이고 같은 object가 sys.modules에서 재사용되는 lifecycle을 deterministic하게 관찰합니다.",
      code: "import contextlib\nimport importlib\nimport io\nimport sys\nimport tempfile\nfrom pathlib import Path\n\nwith tempfile.TemporaryDirectory() as folder:\n    Path(folder, 'study_cache_mod.py').write_text(\"print('module-loaded')\\nVALUE = 42\\n\", encoding='utf-8')\n    sys.path.insert(0, folder)\n    events = io.StringIO()\n    try:\n        with contextlib.redirect_stdout(events):\n            first = importlib.import_module('study_cache_mod')\n            second = importlib.import_module('study_cache_mod')\n        spec = first.__spec__\n        print(f'same={first is second}|cached={sys.modules[\"study_cache_mod\"] is first}|value={first.VALUE}')\n        print(f'events={events.getvalue().splitlines()}|spec={spec.name}|has_location={spec.has_location}')\n    finally:\n        sys.modules.pop('study_cache_mod', None)\n        sys.path.remove(folder)",
      walkthrough: [
        { lines: "1-6", explanation: "import lifecycle 관찰에 필요한 표준 모듈과 임시 파일 Path를 준비합니다." },
        { lines: "8-10", explanation: "import할 때 marker를 출력하고 VALUE를 정의하는 작은 module을 생성해 search path 앞에 둡니다." },
        { lines: "11-18", explanation: "stdout을 capture한 채 같은 이름을 두 번 import하고 identity·cache·spec을 출력합니다." },
        { lines: "19-21", explanation: "finally에서 sys.modules와 sys.path를 복원해 다음 test에 state를 남기지 않습니다." },
      ],
      run: { environment: ["Python 3.11 이상", "임시 directory 생성 권한"], command: "python import_cache_trace.py" },
      output: { value: "same=True|cached=True|value=42\nevents=['module-loaded']|spec=study_cache_mod|has_location=True", explanation: ["두 import는 같은 module object를 반환합니다.", "top-level marker는 한 번만 실행됩니다.", "file-backed module spec은 location을 가집니다."] },
      experiments: [
        { change: "첫 import 뒤 파일 VALUE를99로 바꿉니다.", prediction: "재import만으로는 cached VALUE42가 유지됩니다.", result: "cache와 source file 변경을 구분합니다." },
        { change: "importlib.reload(first)를 호출합니다.", prediction: "top-level marker가 다시 실행되고 module dictionary가 갱신됩니다.", result: "외부 copied binding은 별도임을 확인합니다." },
        { change: "임시 module 이름을 json으로 바꿉니다.", prediction: "search path·기존 cache에 따라 stdlib shadowing 결과가 달라질 수 있습니다.", result: "표준/third-party 이름과 충돌하지 않는 package명을 사용합니다." },
      ],
      sourceRefs: ["python-import-doc", "python-importlib-030", "python-sys-modules-030"],
    }],
    diagnostics: [
      { symptom: "module 파일을 수정했는데 같은 REPL에서 import 결과가 바뀌지 않습니다.", likelyCause: "sys.modules cache의 기존 object를 재사용했습니다.", checks: ["module name이 sys.modules에 있는지 봅니다.", "module.__file__과 source timestamp를 확인합니다.", "from-import copied names 존재를 찾습니다."], fix: "개발 중에는 process를 재시작하거나 제한적으로 importlib.reload를 사용하고 production state migration을 reload에 의존하지 않습니다.", prevention: "배포·test는 새 process에서 설치 artifact를 import합니다." },
      { symptom: "표준 json/csv를 import했는데 로컬 파일의 attribute 오류가 납니다.", likelyCause: "프로젝트 파일이나 directory가 같은 이름으로 search path에서 먼저 resolve됐습니다.", checks: ["module.__spec__.name·origin과 __file__을 봅니다.", "find_spec 결과와 sys.path 순서를 확인합니다.", "충돌 파일명을 검색합니다."], fix: "로컬 module/package를 고유 이름으로 변경하고 import boundary를 package root로 정리합니다.", prevention: "stdlib·dependency top-level name 충돌 lint와 clean environment import test를 둡니다." },
    ],
  },
  {
    id: "package-relative-import-main-module-execution",
    title: "package context·relative import·`python -m` entrypoint를 파일 직접 실행과 분리합니다",
    lead: "relative import는 filesystem 상대 경로가 아니라 `__package__` 기반 fully qualified name을 사용하므로 package module은 package context에서 실행해야 합니다.",
    explanations: [
      "regular package는 보통 __init__.py를 가지며 import 시 package object와 초기화 code가 실행됩니다. namespace package는 여러 location을 합칠 수 있어 단순 directory 하나와 다르며 배포 artifact와 search path를 함께 확인합니다.",
      "`from .config import VALUE`의 leading dot은 현재 package를 기준으로 합니다. 파일을 `python pkg/app.py`로 직접 실행하면 top-level module은 package context가 없어 relative import가 실패할 수 있습니다.",
      "`python -m pkg.app`는 import machinery로 spec과 package를 설정한 뒤 해당 code를 `__main__` namespace에서 실행합니다. library package의 CLI는 짧은 __main__.py가 test 가능한 main function을 import해 호출하도록 만듭니다.",
      "main guard는 import 때 CLI parsing·print·network를 막지만 guard 안에 모든 business logic을 넣으면 test하기 어렵습니다. `main(argv=None)->int`에 orchestration을 두고 guard는 `raise SystemExit(main())` 정도로 유지합니다.",
      "absolute import는 public package 관계를 명확히 하고 refactor 도구에 유리하며 explicit relative import는 package 내부 sibling 관계를 간결하게 표현합니다. 일관된 규칙을 선택하고 sys.path를 runtime에서 임의 수정하는 workaround를 production에 두지 않습니다.",
      "`__name__`, `__package__`, `__spec__`는 실행 방식에 따라 달라집니다. code가 이 값을 business decision으로 과도하게 사용하지 않게 하고 diagnostics와 entrypoint guard에 제한합니다.",
      "package __init__.py에서 무거운 submodule을 모두 import하면 단순 package import도 느려지고 cycle surface가 커집니다. public API re-export는 의도적으로 관리하고 optional dependency는 사용 시점 boundary에서 오류를 설명합니다.",
    ],
    concepts: [
      { term: "package context", definition: "relative import가 기준으로 삼는 fully qualified package 이름과 spec 정보입니다.", detail: ["__package__로 드러납니다.", "파일 경로만으로 정해지지 않습니다."] },
      { term: "module execution with -m", definition: "import system으로 module을 찾아 package 정보를 유지한 채 top-level __main__으로 실행하는 방식입니다.", detail: ["relative import가 동작합니다.", "CLI entrypoint에 적합합니다."] },
      { term: "composition root", definition: "configuration·dependencies·CLI adapter를 조립하고 application use case를 시작하는 entrypoint 경계입니다.", detail: ["import side effect를 줄입니다.", "main을 얇게 유지합니다."] },
    ],
    codeExamples: [{
      id: "python-runpy-package-relative-main",
      title: "임시 package module을 __main__으로 실행해 relative import context를 확인합니다",
      language: "python",
      filename: "package_main_context.py",
      purpose: "runpy의 -m 대응 실행에서 __name__은 __main__, __package__는 package 이름으로 유지되는지 exact 관찰합니다.",
      code: "import contextlib\nimport io\nimport runpy\nimport sys\nimport tempfile\nfrom pathlib import Path\n\nwith tempfile.TemporaryDirectory() as folder:\n    package = Path(folder, 'demo_pkg')\n    package.mkdir()\n    package.joinpath('__init__.py').write_text('', encoding='utf-8')\n    package.joinpath('config.py').write_text('VALUE = 42\\n', encoding='utf-8')\n    package.joinpath('app.py').write_text(\n        \"from .config import VALUE\\n\"\n        \"def main():\\n\"\n        \"    print(f'value={VALUE}|name={__name__}|package={__package__}')\\n\"\n        \"if __name__ == '__main__':\\n\"\n        \"    main()\\n\",\n        encoding='utf-8',\n    )\n    sys.path.insert(0, folder)\n    events = io.StringIO()\n    try:\n        with contextlib.redirect_stdout(events):\n            runpy.run_module('demo_pkg.app', run_name='__main__')\n        print(f'events={events.getvalue().splitlines()}')\n        print(f'package_cached={\"demo_pkg\" in sys.modules}|config_cached={\"demo_pkg.config\" in sys.modules}')\n    finally:\n        for name in list(sys.modules):\n            if name == 'demo_pkg' or name.startswith('demo_pkg.'):\n                sys.modules.pop(name, None)\n        sys.path.remove(folder)",
      walkthrough: [
        { lines: "1-6", explanation: "runpy·capture·임시 package 생성을 위한 표준 모듈을 준비합니다." },
        { lines: "8-20", explanation: "__init__, config와 relative import를 쓰는 app module을 생성합니다." },
        { lines: "21-27", explanation: "package root를 search path에 두고 app을 __main__으로 실행해 출력과 cache를 관찰합니다." },
        { lines: "28-32", explanation: "package 관련 cache entries와 search path를 모두 정리합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "임시 directory 생성 권한"], command: "python package_main_context.py" },
      output: { value: "events=['value=42|name=__main__|package=demo_pkg']\npackage_cached=True|config_cached=True", explanation: ["실행 code의 __name__은 __main__입니다.", "relative import 기준 __package__는 demo_pkg로 유지됩니다.", "package와 config dependency는 sys.modules에 cache됩니다."] },
      experiments: [
        { change: "app.py를 path로 직접 실행합니다.", prediction: "package context가 없어 relative import 오류가 날 수 있습니다.", result: "package module은 `python -m demo_pkg.app`로 실행합니다." },
        { change: "main guard를 제거합니다.", prediction: "normal import에서도 main 출력이 발생합니다.", result: "library import와 CLI execution을 분리합니다." },
        { change: "__init__.py에서 app을 즉시 import합니다.", prediction: "package import side effect와 cycle surface가 커집니다.", result: "re-export를 최소화합니다." },
      ],
      sourceRefs: ["python-main-doc", "python-runpy-030", "python-import-doc", "python-importlib-030"],
    }],
    diagnostics: [
      { symptom: "`attempted relative import with no known parent package`가 납니다.", likelyCause: "relative import가 있는 module 파일을 package context 없이 path로 직접 실행했습니다.", checks: ["__package__와 __spec__을 봅니다.", "package root와 __init__.py/namespace 구성을 확인합니다.", "실행 command가 -m인지 확인합니다."], fix: "설치된/package root 환경에서 `python -m package.module` 또는 console entrypoint로 실행합니다.", prevention: "README·IDE launch config·CI를 동일한 module entrypoint로 고정합니다." },
    ],
  },
  {
    id: "circular-import-boundaries-pyproject",
    title: "circular import를 dependency 방향으로 해소하고 pyproject의 build·package 경계를 고정합니다",
    lead: "cycle은 두 파일이 존재해서가 아니라 module initialization 중 아직 만들어지지 않은 이름을 서로 요구할 때 드러나며 공통 계약 추출과 layer 방향으로 해결합니다.",
    explanations: [
      "A가 import B를 실행하면 A는 fully initialized되기 전에 sys.modules에 들어갑니다. B가 다시 A의 아직 정의되지 않은 이름을 from-import하면 partially initialized module 오류가 발생할 수 있습니다.",
      "import를 함수 안으로 옮기는 local import는 사용 시점까지 cycle을 늦출 수 있지만 dependency 구조를 숨길 수도 있습니다. optional dependency·type-only import처럼 근거가 있을 때 사용하고 core cycle은 layer 분리로 해소합니다.",
      "두 module이 공유하는 dataclass·Protocol·constant를 낮은 dependency module로 이동하면 A와 B가 같은 방향으로 의존할 수 있습니다. high-level orchestration은 둘을 import하되 low-level modules가 entrypoint를 역참조하지 않게 합니다.",
      "type annotation만 cycle을 만들면 `from __future__ import annotations`와 `if TYPE_CHECKING:` import를 사용해 runtime dependency를 줄일 수 있습니다. 실제 runtime base class·decorator·default 값은 여전히 import가 필요합니다.",
      "pyproject.toml의 build-system은 source tree를 wheel/sdist로 만드는 backend boundary이고 project metadata·dependencies·scripts가 설치 결과를 정의합니다. working directory에서 우연히 import되는 것과 built wheel에서 import되는 것을 모두 시험합니다.",
      "src layout은 repository root의 미설치 package를 우연히 import하는 문제를 줄여 packaging 누락을 빨리 찾을 수 있습니다. flat layout도 가능하지만 package discovery와 tests가 어떤 artifact를 import하는지 명확히 합니다.",
      "dependency 이름을 sys.path.append로 임시 해결하면 machine별 순서와 shadowing이 생깁니다. editable install 또는 built wheel을 isolated environment에 설치하고 console script를 통해 실행합니다.",
      "cycle test는 새 process에서 A-first·B-first 두 순서로 import하고 import-time stdout/stderr·I/O가 없는지 검사합니다. import time 성능과 optional dependency 오류 메시지도 public 품질입니다.",
    ],
    concepts: [
      { term: "partially initialized module", definition: "module object는 cache에 있지만 top-level 실행이 아직 끝나지 않아 일부 이름만 존재하는 상태입니다.", detail: ["cycle에서 관찰됩니다.", "import 순서 의존 오류를 만듭니다."] },
      { term: "dependency inversion", definition: "구체 high-level module을 서로 참조하는 대신 낮은 수준의 안정된 contract에 양쪽이 의존하도록 방향을 바꾸는 설계입니다.", detail: ["Protocol·data model을 추출할 수 있습니다.", "cycle surface를 줄입니다."] },
      { term: "build boundary", definition: "source tree가 pyproject backend를 통해 설치 가능한 wheel/sdist로 변환되는 계약입니다.", detail: ["package discovery를 검증합니다.", "로컬 경로 우연성을 제거합니다."] },
    ],
    codeExamples: [{
      id: "python-circular-import-contract-extraction",
      title: "재현한 circular import를 shared contract module 추출로 해소합니다",
      language: "python",
      filename: "circular_import_fix.py",
      purpose: "partially initialized failure type을 확인하고 dependency를 한 방향으로 재작성해 같은 process에서 clean import합니다.",
      code: "import importlib\nimport sys\nimport tempfile\nfrom pathlib import Path\n\nwith tempfile.TemporaryDirectory() as folder:\n    root = Path(folder)\n    root.joinpath('cycle_a.py').write_text(\"from cycle_b import B\\nA = 'a'\\n\", encoding='utf-8')\n    root.joinpath('cycle_b.py').write_text(\"from cycle_a import A\\nB = 'b'\\n\", encoding='utf-8')\n    sys.path.insert(0, folder)\n    try:\n        try:\n            importlib.import_module('cycle_a')\n        except ImportError as error:\n            print(f'cycle={type(error).__name__}')\n        finally:\n            sys.modules.pop('cycle_a', None)\n            sys.modules.pop('cycle_b', None)\n\n        root.joinpath('cycle_shared.py').write_text(\"A = 'a'\\n\", encoding='utf-8')\n        root.joinpath('cycle_b.py').write_text(\"from cycle_shared import A\\nB = 'b'\\n\", encoding='utf-8')\n        root.joinpath('cycle_a.py').write_text(\"from cycle_shared import A\\nfrom cycle_b import B\\nRESULT = A + B\\n\", encoding='utf-8')\n        importlib.invalidate_caches()\n        fixed = importlib.import_module('cycle_a')\n        loaded = sorted(name for name in ('cycle_a', 'cycle_b', 'cycle_shared') if name in sys.modules)\n        print(f'fixed={fixed.RESULT}|loaded={loaded}')\n    finally:\n        for name in ('cycle_a', 'cycle_b', 'cycle_shared'):\n            sys.modules.pop(name, None)\n        sys.path.remove(folder)",
      walkthrough: [
        { lines: "1-4", explanation: "dynamic import와 임시 module files를 만들 표준 도구를 준비합니다." },
        { lines: "6-15", explanation: "A와 B가 아직 정의되지 않은 서로의 이름을 from-import하는 cycle을 만들고 ImportError type을 포착합니다." },
        { lines: "16-19", explanation: "partial cache entries를 정리해 fixed import가 이전 실패 state를 재사용하지 않게 합니다." },
        { lines: "20-26", explanation: "공통 A를 shared module로 추출하고 dependency를 shared→B, shared+B→A 방향으로 바꾼 뒤 finder cache를 무효화합니다." },
        { lines: "27-30", explanation: "fixed result와 loaded modules를 출력하고 module cache·search path를 정리합니다." },
      ],
      run: { environment: ["Python 3.11 이상", "임시 directory 생성 권한"], command: "python circular_import_fix.py" },
      output: { value: "cycle=ImportError\nfixed=ab|loaded=['cycle_a', 'cycle_b', 'cycle_shared']", explanation: ["첫 구조는 partially initialized A의 이름을 B가 요구해 실패합니다.", "shared contract 추출 뒤 세 modules가 정상 초기화됩니다.", "cache cleanup으로 실패 state가 다음 단계에 섞이지 않습니다."] },
      experiments: [
        { change: "cycle_a에서 A assignment를 import보다 앞으로 옮깁니다.", prediction: "특정 순서에서는 실행될 수 있지만 fragile order dependency는 남습니다.", result: "이름 순서 조정보다 dependency 방향을 고칩니다." },
        { change: "cycle_b import를 함수 안으로 옮깁니다.", prediction: "module import는 성공하지만 함수 호출 시 cycle/결합 문제가 나타날 수 있습니다.", result: "local import의 근거를 문서화합니다." },
        { change: "shared에 high-level service import를 다시 추가합니다.", prediction: "cycle이 새로운 모양으로 돌아옵니다.", result: "contract layer가 상위 구현을 참조하지 않게 합니다." },
      ],
      sourceRefs: ["python-import-doc", "python-importlib-030", "python-sys-modules-030", "pyproject-spec-030", "py-import-consumer-source"],
    }],
    diagnostics: [
      { symptom: "cannot import name ... from partially initialized module 오류가 납니다.", likelyCause: "서로의 top-level name을 초기화가 끝나기 전에 from-import하는 cycle이 있습니다.", checks: ["import graph와 첫 실행 순서를 그립니다.", "두 modules의 top-level name 정의 위치를 봅니다.", "shared contracts와 TYPE_CHECKING-only imports를 구분합니다."], fix: "공통 model·Protocol을 낮은 module로 추출하고 dependency direction을 단방향으로 만듭니다.", prevention: "각 public module을 새 process에서 서로 다른 순서로 import하는 smoke test를 둡니다." },
    ],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...advancedImportChapters);

(session.sources as DetailedSession["sources"]).push(
  { id: "python-importlib-030", repository: "Python Standard Library", path: "importlib — The implementation of import", publicUrl: "https://docs.python.org/3/library/importlib.html", usedFor: ["import_module", "reload", "find_spec", "cache invalidation"], evidence: "programmatic import·reload·spec API와 주의사항을 공식 문서로 확인했습니다." },
  { id: "python-sys-modules-030", repository: "Python Standard Library", path: "sys.modules", publicUrl: "https://docs.python.org/3/library/sys.html#sys.modules", usedFor: ["module cache", "identity", "cache mutation", "partial initialization"], evidence: "loaded modules를 이름으로 보관하는 mapping과 수정 주의사항을 공식 문서로 확인했습니다." },
  { id: "python-runpy-030", repository: "Python Standard Library", path: "runpy.run_module", publicUrl: "https://docs.python.org/3/library/runpy.html#runpy.run_module", usedFor: ["-m style execution", "run_name", "package context", "__main__"], evidence: "module code를 locating한 뒤 special globals를 설정해 실행하는 공식 API를 확인했습니다." },
  { id: "pyproject-spec-030", repository: "Python Packaging Authority", path: "pyproject.toml specification", publicUrl: "https://packaging.python.org/en/latest/specifications/pyproject-toml/", usedFor: ["build-system", "project metadata", "dependencies", "entry points"], evidence: "source tree와 설치 artifact 사이 build·metadata 경계를 공식 PyPA specification으로 확인했습니다." },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "같은 module을 두 번 import하면 top-level code도 두 번 실행되나요?", answer: "보통 sys.modules의 같은 object를 재사용해 첫 정상 import에서만 실행됩니다." },
  { question: "importlib.reload가 `from mod import name`으로 복사한 이름도 갱신하나요?", answer: "아닙니다. 외부 namespace의 기존 binding은 자동으로 바뀌지 않습니다." },
  { question: "relative import의 dot은 현재 파일 directory를 기준으로 하나요?", answer: "아닙니다. module의 package context와 fully qualified name을 기준으로 합니다." },
  { question: "package 내부 CLI module은 왜 path 실행보다 `python -m`이 적합한가요?", answer: "import machinery가 spec과 __package__를 설정해 relative import와 package identity를 유지하기 때문입니다." },
  { question: "main guard 안에 business logic 전체를 넣어도 되나요?", answer: "실행은 되지만 test하기 어려워 main 함수·use case로 분리하고 guard는 얇게 둡니다." },
  { question: "circular import는 import를 함수 안으로 옮기면 항상 해결되나요?", answer: "지연될 수 있지만 구조적 결합은 남으므로 공통 contract 추출과 dependency 방향 수정이 우선입니다." },
  { question: "pyproject build 검증 없이 repository root import만 성공하면 충분한가요?", answer: "아닙니다. wheel/sdist에 package와 metadata가 올바르게 포함되어 설치 후 import되는지 검증해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "import resolution·ModuleSpec·execution·sys.modules cache 단계를 추적한다.",
  "module top-level side effect를 최소화하고 entrypoint로 옮긴다.",
  "reload와 from-import binding의 한계를 설명한다.",
  "relative import를 package context와 -m 실행으로 검증했다.",
  "main guard와 test 가능한 main 함수를 분리한다.",
  "partially initialized circular import를 dependency graph로 진단한다.",
  "pyproject build artifact를 isolated environment에서 import한다.",
);
