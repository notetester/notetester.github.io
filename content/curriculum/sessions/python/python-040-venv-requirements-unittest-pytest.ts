import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-040"],
  slug: "python-040-venv-requirements-unittest-pytest",
  courseId: "python",
  moduleId: "04-reliability-tooling",
  order: 40,
  title: "가상환경·요구사항·unittest·pytest",
  subtitle: "어느 Python과 dependency로 실행했는지 재현하고, 정상·경계·실패 계약을 자동 테스트해 로컬의 우연을 CI 증거로 바꿉니다.",
  level: "고급",
  estimatedMinutes: 210,
  coreQuestion: "개발자 PC와 CI·배포가 같은 interpreter·package graph·테스트 계약을 사용하도록 환경을 격리하고 실패를 빠르고 결정적으로 검증하려면 무엇을 고정해야 할까요?",
  summary: "sys.executable·prefix/base_prefix·sys.path와 importlib.metadata로 실행 환경을 확인하고 venv의 interpreter/site-packages 격리를 재현합니다. requirements spec과 설치 snapshot·lock·hash·pyproject를 구분합니다. 원본 calc의 unittest 5개, 고급 3 성공+1 skip, pytest parameter node 9개를 실행 증거로 삼아 AAA·예외·float·fixture·parametrize·discovery를 다룹니다. hermetic CI·matrix·coverage·flaky test·dependency 보안·artifact provenance까지 Python 기초 과정의 마지막 운영 loop로 완성합니다.",
  objectives: [
    "sys.executable·version·prefix/base_prefix·sys.path로 실제 실행 interpreter와 가상환경 여부를 진단할 수 있다.",
    "venv 생성·activation·명시 interpreter 호출의 역할을 구분하고 project별 환경을 재생성할 수 있다.",
    "distribution 이름·import 이름·설치 version을 importlib.metadata와 python -m pip로 같은 interpreter에서 확인할 수 있다.",
    "requirements 범위 spec·freeze snapshot·lock file·hash·pyproject build metadata의 목적 차이를 설명할 수 있다.",
    "테스트를 Arrange-Act-Assert와 정상·경계·실패 contract로 설계하고 시간·난수·I/O를 격리할 수 있다.",
    "unittest TestCase·setUp·assertRaises·subTest·skip과 pytest assert·raises·approx·fixture·parametrize를 사용할 수 있다.",
    "test discovery·import mode·working directory 문제를 진단하고 python -m 형태로 환경을 일치시킬 수 있다.",
    "CI matrix·coverage·flaky test·dependency audit·artifact provenance를 품질 gate로 설계할 수 있다.",
  ],
  prerequisites: [
    { title: "함수 계약·스코프·반환", reason: "테스트할 production code를 import 가능한 작은 함수와 명확한 계약으로 분리합니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "예외 분류·else·finally", reason: "assertRaises·pytest.raises로 실패 계약을 검증하고 fixture cleanup을 보장합니다.", sessionSlug: "python-035-exception-classification-else-finally" },
    { title: "모듈 import와 main guard", reason: "test discovery·package import·python -m 실행과 환경 search path를 연결합니다.", sessionSlug: "python-030-module-import-main-guard" },
  ],
  keywords: ["Python", "venv", "virtual environment", "pip", "requirements", "lock file", "pyproject", "unittest", "pytest", "fixture", "parametrize", "CI", "coverage", "flaky test"],
  chapters: [
    {
      id: "interpreter-environment-identity",
      title: "첫 진단은 명령 이름이 아니라 실제 sys.executable·version·prefix·search path입니다",
      lead: "터미널의 python·pip·IDE·notebook kernel이 서로 다른 환경을 가리키면 설치했는데 import되지 않는 모순처럼 보입니다.",
      explanations: [
        "원본 ex01은 sys.executable, platform.python_version, sys.prefix, sys.base_prefix를 출력합니다. 일반 venv에서는 prefix와 base_prefix가 다릅니다. Conda·embedded·system package manager 환경은 추가 metadata가 있으므로 한 boolean만으로 모든 환경 종류를 분류하지 않습니다.",
        "Windows py launcher, PATH의 python.exe, VS Code interpreter, Jupyter kernel은 각각 다른 executable을 선택할 수 있습니다. 오류가 난 process 안에서 sys.executable을 확인하고 그 executable로 -m pip를 실행합니다.",
        "sys.path는 import search 경로이며 cwd·script 위치·site-packages·.pth·editable install의 영향을 받습니다. package가 설치됐다고 생각해도 다른 interpreter의 site-packages에 있거나 local 파일이 shadowing할 수 있습니다.",
        "환경 보고서에는 절대 사용자 path를 공개 로그에 그대로 남기지 않습니다. 내부 진단 artifact에는 접근 제어하고 외부 report에는 Python version·환경 type·package version·platform처럼 필요한 metadata만 제공합니다.",
      ],
      concepts: [
        { term: "interpreter identity", definition: "현재 process를 실행하는 Python executable과 version·implementation·환경 prefix의 조합입니다.", detail: ["sys.executable이 핵심 증거입니다.", "shell 명령 alias와 다를 수 있습니다."] },
        { term: "environment prefix", definition: "현재 Python이 library·configuration을 찾는 환경 root이며 venv에서 base interpreter prefix와 달라집니다.", detail: ["sys.prefix와 sys.base_prefix로 비교합니다.", "Conda는 별도 환경 metadata도 봅니다."] },
      ],
      codeExamples: [
        {
          id: "isolated-venv-proof",
          title: "임시 venv의 별도 interpreter와 prefix를 process로 검증",
          language: "python",
          filename: "venv_probe.py",
          purpose: "activation에 의존하지 않고 임시 가상환경 interpreter를 직접 호출해 격리 사실을 안정적인 boolean으로 출력합니다.",
          code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\nimport os\nimport subprocess\nimport sys\n\nwith TemporaryDirectory() as temp_dir:\n    env_dir = Path(temp_dir) / 'env'\n    subprocess.run([sys.executable, '-m', 'venv', str(env_dir)], check=True)\n    child_python = env_dir / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')\n    probe = (\n        \"import json, sys\\n\"\n        \"print(json.dumps({\\\"in_venv\\\": sys.prefix != sys.base_prefix, \"\n        \"\\\"different_executable\\\": sys.executable != sys.argv[1], \"\n        \"\\\"stdlib_ok\\\": __import__('json') is not None}))\"\n    )\n    result = subprocess.run(\n        [str(child_python), '-c', probe, sys.executable],\n        text=True, capture_output=True, check=True,\n    )\n    print(result.stdout.strip())",
          walkthrough: [
            { lines: "1-8", explanation: "현재 interpreter의 stdlib venv module로 TemporaryDirectory 안 격리 환경을 생성합니다." },
            { lines: "9", explanation: "Windows와 POSIX venv의 interpreter 위치를 platform에 맞게 선택합니다." },
            { lines: "10-15", explanation: "child process가 prefix 차이, parent와 executable 차이, stdlib import 성공을 JSON으로 출력하는 probe를 만듭니다." },
            { lines: "16-20", explanation: "activation 없이 child executable을 직접 호출해 어떤 interpreter가 실행되는지 명시합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "venv module 사용 가능", "venv_probe.py로 저장"], command: "python venv_probe.py" },
          output: { value: "{\"in_venv\": true, \"different_executable\": true, \"stdlib_ok\": true}", explanation: ["child prefix와 base_prefix가 달라 가상환경입니다.", "child sys.executable은 parent executable path와 다릅니다.", "표준 library는 base Python에서 제공되어 새 환경에서도 import됩니다."] },
          experiments: [
            { change: "child_python 대신 sys.executable로 probe를 실행합니다.", prediction: "different_executable과 현재 환경에 따른 in_venv 결과가 달라집니다.", result: "activation보다 실제 executable 선택이 결정적입니다." },
            { change: "child에서 외부 package import를 시도합니다.", prediction: "system-site-packages를 사용하지 않은 새 venv에는 설치되지 않아 ImportError일 수 있습니다.", result: "venv가 project dependency를 자동 복사하지 않음을 확인합니다." },
          ],
          sourceRefs: ["py-env-info-source", "python-venv-doc"],
        },
      ],
      diagnostics: [
        { symptom: "pip install은 성공했는데 Python에서 ModuleNotFoundError가 난다.", likelyCause: "pip와 실행 Python이 서로 다른 interpreter/environment를 가리킵니다.", checks: ["실패 process의 sys.executable을 출력합니다.", "그 경로 -m pip --version을 실행합니다.", "importlib.util.find_spec와 package distribution version을 확인합니다."], fix: "항상 대상 interpreter로 python -m pip를 호출하고 IDE/kernel interpreter를 같은 환경으로 선택합니다.", prevention: "bootstrap script와 CI가 explicit interpreter를 사용하고 환경 report를 artifact로 남깁니다." },
      ],
    },
    {
      id: "venv-lifecycle",
      title: "venv는 project dependency를 격리하며 activation은 PATH 편의 기능이지 필수 조건이 아닙니다",
      lead: "환경 폴더는 source control에 넣지 않고 선언·lock으로 언제든 재생성할 수 있어야 합니다.",
      explanations: [
        "python -m venv .venv는 현재 Python을 기반으로 독립 prefix와 site-packages를 만듭니다. activation은 shell PATH와 prompt를 바꿔 python·pip가 .venv를 먼저 가리키게 합니다. .venv/Scripts/python.exe처럼 직접 호출하면 activation 없이도 정확합니다.",
        "venv는 base interpreter binary·stdlib를 공유할 수 있어 완전 container 격리가 아닙니다. OS library·compiler·GPU driver는 별도 환경 의존성입니다. production 재현에는 container/image·system package manifest도 고려합니다.",
        "가상환경을 다른 path·OS로 복사하면 script shebang·launcher가 깨질 수 있습니다. source와 lock에서 재생성합니다. Python minor version upgrade도 새 environment를 만들고 dependency compatibility를 검증합니다.",
        "VIRTUAL_ENV 환경 변수는 activation 표시일 뿐 현재 process가 그 환경을 쓴다는 절대 증거가 아닐 수 있습니다. sys.executable·prefix를 기준으로 진단합니다.",
      ],
      concepts: [
        { term: "activation", definition: "현재 shell의 PATH·prompt 등을 바꿔 가상환경 command를 기본 선택하게 하는 편의 script 실행입니다.", detail: ["Python runtime 기능 자체는 아닙니다.", "명시 executable 호출로 대체할 수 있습니다."] },
        { term: "rebuildable environment", definition: "환경 폴더 자체를 보관하지 않고 interpreter version·dependency 선언·lock으로 동일 목적 환경을 새로 만들 수 있는 상태입니다.", detail: ["source control에 .venv를 넣지 않습니다.", "OS-level dependency도 기록합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "가상환경 폴더를 다른 PC로 복사했더니 실행 경로·launcher가 깨진다.", likelyCause: "venv 내부 script가 생성 당시 절대 path·platform에 의존하는데 이동 가능한 artifact로 취급했습니다.", checks: ["pyvenv.cfg와 Scripts/bin launcher path를 확인합니다.", "Python/OS architecture를 비교합니다.", "lock에서 새 환경 재생성이 가능한지 봅니다."], fix: "복사본을 버리고 대상 Python으로 새 venv를 만든 뒤 lock/requirements에서 설치합니다.", prevention: "환경 생성 script와 clean-machine CI를 유지합니다." },
      ],
    },
    {
      id: "packages-distributions-metadata",
      title: "설치 distribution 이름·import module 이름·version metadata는 같지 않을 수 있습니다",
      lead: "pip가 관리하는 distribution과 import가 찾는 package/module을 구분해야 설치·version 진단이 정확합니다.",
      explanations: [
        "원본 importlib.metadata.version('numpy')는 설치 distribution version을 읽고 PackageNotFoundError를 처리합니다. __import__('module')은 import 성공 여부를 검사하지만 import-time side effect와 내부 ImportError를 실행할 수 있어 단순 availability check에 importlib.util.find_spec를 고려합니다.",
        "distribution 이름 PyYAML의 import는 yaml, scikit-learn은 sklearn처럼 다를 수 있습니다. pip install 이름을 import 이름으로 기계 변환하지 말고 package 문서를 확인합니다.",
        "importlib.metadata.distributions 전체 목록은 현재 interpreter environment의 설치 상태 snapshot입니다. transitive dependency까지 많고 순서는 정규화가 필요합니다. 개인정보 path·editable source URL을 공개 artifact에서 주의합니다.",
        "같은 distribution version도 build tag·platform wheel·optional extra·system library에 따라 동작이 다를 수 있습니다. provenance에는 Python implementation·platform·lock·wheel hash를 포함합니다.",
      ],
      concepts: [
        { term: "distribution package", definition: "pip 등 설치 도구가 metadata·version·dependency 단위로 관리하는 배포 artifact입니다.", detail: ["import package 이름과 다를 수 있습니다.", "importlib.metadata로 조회합니다."] },
        { term: "import package", definition: "Python import statement가 module search path에서 찾는 module·package namespace입니다.", detail: ["한 distribution이 여러 import package를 제공할 수 있습니다.", "local module이 shadowing할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "importlib.metadata version은 있는데 import가 실패하거나 엉뚱한 local 파일을 읽는다.", likelyCause: "distribution/import 이름 차이, missing optional dependency, local shadowing 또는 다른 sys.path origin입니다.", checks: ["module.__file__·__spec__.origin을 확인합니다.", "distribution top_level metadata·문서를 봅니다.", "traceback 내부 dependency ImportError를 구분합니다."], fix: "정확한 import 이름과 optional extra를 설치하고 충돌 local 파일 이름을 바꾸며 환경을 재생성합니다.", prevention: "clean venv import smoke test와 dependency extras matrix를 CI에 둡니다." },
      ],
    },
    {
      id: "requirements-locks-build-metadata",
      title: "요구 범위·해결된 lock·환경 snapshot은 서로 다른 재현 목적을 가집니다",
      lead: "requirements.txt 한 파일도 사람이 작성한 direct spec인지 pip freeze 전체 snapshot인지에 따라 업데이트·재현 의미가 다릅니다.",
      explanations: [
        "name==1.2.3은 정확 pin, >=는 최소, ~=는 compatible release 범위입니다. 범위 requirements를 나중 설치하면 resolver가 새 transitive version을 선택해 결과가 달라질 수 있습니다. application은 lock된 전체 graph, library는 호환 범위와 여러 dependency matrix가 일반적입니다.",
        "pip freeze는 현재 환경의 모든 distribution을 나열하지만 direct/transitive·불필요 package·platform marker 이유를 설명하지 않습니다. 깨끗한 project env에서 snapshot으로 쓰고 source declaration과 분리합니다.",
        "pyproject.toml은 build system·project metadata·dependency·tool config의 표준 중심입니다. lock format은 사용하는 tool을 선택하고 CI에서 sync/check합니다. hashes는 artifact substitution 위험과 동일 resolution을 통제합니다.",
        "requirements parser를 간단 regex로 직접 만들면 extras, markers, URL, editable, comments, line continuation, constraints를 놓칩니다. packaging.requirements 같은 표준 parser/tool을 사용합니다. 외부 requirements를 무조건 설치하는 것은 code execution/supply-chain 경계입니다.",
      ],
      concepts: [
        { term: "dependency lock", definition: "resolver가 선택한 direct·transitive package version과 종종 artifact hash·marker를 고정한 재현 설치 자료입니다.", detail: ["source dependency 범위와 구분합니다.", "Python·platform별 resolution을 관리할 수 있습니다."] },
        { term: "environment snapshot", definition: "특정 시점 환경에 실제 설치된 distribution 목록을 기록한 자료입니다.", detail: ["pip freeze가 대표적입니다.", "왜 필요한 dependency인지 자동 설명하지 않습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "어제와 같은 requirements를 설치했는데 transitive package가 달라지고 test가 깨진다.", likelyCause: "version 범위만 있고 전체 resolution lock·hash가 없어 resolver가 새 version을 선택했습니다.", checks: ["direct spec과 실제 설치 graph를 비교합니다.", "lock 생성·sync 시점과 index를 확인합니다.", "Python/platform marker 차이를 봅니다."], fix: "application 전체 graph를 lock하고 CI에서 locked sync를 사용하며 의도적 update PR로만 변경합니다.", prevention: "dependency diff·clean install test·artifact hash·trusted index 정책을 둡니다." },
      ],
    },
    {
      id: "test-design-contracts",
      title: "좋은 테스트는 구현 줄 수가 아니라 관찰 가능한 계약과 실패 이유를 작고 결정적으로 검증합니다",
      lead: "Arrange-Act-Assert로 입력·행동·기대를 분리하고 정상·경계·실패를 독립적으로 이름 짓습니다.",
      explanations: [
        "원본 calc는 add·subtract·divide·is_even production code를 별도 module에 두고 test가 import합니다. main/demo와 test 대상이 분리되어 import side effect가 없습니다.",
        "한 test는 하나의 행동 이유로 실패하게 만들되 필요한 여러 assertion은 같은 결과 contract를 검증할 수 있습니다. 구현 내부 private call 횟수보다 반환·exception·state·외부 protocol을 test하면 refactor에 강합니다.",
        "시간·난수·network·filesystem을 직접 사용하면 flaky·slow합니다. clock·RNG·repository를 주입하고 TemporaryDirectory·fake server처럼 통제된 경계를 사용합니다. mock이 실제 protocol과 drift하지 않게 contract/integration test를 둡니다.",
        "예외 test는 class뿐 아니라 구조화 속성·state 불변성을 확인합니다. 단순 '오류가 났다'가 아니라 divide(10,0)가 ValueError 계약인지, 실패 뒤 side effect가 없는지 검증합니다.",
      ],
      concepts: [
        { term: "Arrange-Act-Assert", definition: "test 준비, 대상 행동 한 번, 결과 검증을 구분해 의도와 실패 위치를 명확히 하는 구조입니다.", detail: ["Given-When-Then과 유사합니다.", "복잡 fixture와 여러 행동을 줄입니다."] },
        { term: "test double", definition: "실제 dependency 대신 test에서 통제하는 fake·stub·spy·mock 객체입니다.", detail: ["각 종류의 목적을 구분합니다.", "실제 interface와 drift하지 않게 contract test합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "test가 구현 refactor만 해도 대량 실패하지만 사용자 행동은 그대로다.", likelyCause: "private method 호출 순서·내부 자료구조·과도한 mock 같은 구현 세부를 assertion했습니다.", checks: ["실패 assertion이 public contract인지 분류합니다.", "mock call count가 실제 요구인지 봅니다.", "더 높은 수준 결과로 검증 가능한지 확인합니다."], fix: "public 출력·state·exception·protocol interaction 중심으로 다시 작성하고 내부 순서 assertion을 줄입니다.", prevention: "test review에 behavior vs implementation 질문을 포함합니다." },
      ],
    },
    {
      id: "unittest-toolbox",
      title: "unittest는 표준 library의 class 기반 lifecycle·assert·subTest·skip 도구를 제공합니다",
      lead: "TestCase의 test_ method마다 새 instance와 setUp이 실행되어 공유 state 오염을 줄입니다.",
      explanations: [
        "원본 기본 suite는 add·subtract·divide·is_even·divide by zero 5개가 통과합니다. setUp의 a=10,b=5는 각 test 전에 새로 준비됩니다. class variable·module global은 여전히 공유될 수 있습니다.",
        "assertEqual·True·False·In·Greater·Raises 등 의미 있는 assertion은 generic assert보다 실패 diff를 잘 보여 줍니다. float는 assertAlmostEqual을 쓰되 places/abs tolerance가 domain 정확도와 맞는지 정합니다.",
        "subTest는 한 method 안 여러 case를 계속 실행해 어떤 입력이 실패했는지 보여 줍니다. 각각 완전 독립 fixture·병렬·개별 선택이 필요하면 별도 parameterized test 도구가 나을 수 있습니다.",
        "skip은 환경·미구현 조건을 명시하지만 영구 skip은 부채를 숨깁니다. 이유·issue·만료를 관리하고 expectedFailure를 성공으로 바뀌었을 때 확인합니다. tearDown보다 addCleanup/context manager가 setup 중 실패 cleanup에 강할 수 있습니다.",
      ],
      concepts: [
        { term: "TestCase lifecycle", definition: "test method별 instance 생성과 setUp→test→tearDown·cleanup 실행 순서입니다.", detail: ["각 test의 instance field를 격리합니다.", "class/module state는 별도 관리합니다."] },
        { term: "subTest", definition: "하나의 test method 안 여러 입력을 label과 함께 검증하고 일부 실패 뒤 다음 case를 계속 실행하는 context입니다.", detail: ["testsRun 수와 case 수는 다를 수 있습니다.", "복잡 fixture 독립성에는 한계가 있습니다."] },
      ],
      codeExamples: [
        {
          id: "stable-unittest-summary",
          title: "unittest 정상·예외·subTest·skip을 안정적인 summary로 검증",
          language: "python",
          filename: "unittest_contracts.py",
          purpose: "runner timing·환경 문구를 제외하고 testsRun·failure·error·skip count를 정확히 출력합니다.",
          code: "import io\nimport unittest\n\ndef divide(a, b):\n    if b == 0:\n        raise ValueError('division by zero')\n    return a / b\n\ndef is_even(value):\n    return value % 2 == 0\n\nclass ContractTests(unittest.TestCase):\n    def test_divide(self):\n        self.assertEqual(divide(10, 2), 5.0)\n\n    def test_divide_by_zero(self):\n        with self.assertRaisesRegex(ValueError, 'division by zero'):\n            divide(10, 0)\n\n    def test_even_cases(self):\n        for value, expected in [(2, True), (3, False), (0, True), (-4, True)]:\n            with self.subTest(value=value):\n                self.assertEqual(is_even(value), expected)\n\n    @unittest.skip('demonstration skip')\n    def test_future_feature(self):\n        self.fail('not implemented')\n\nsuite = unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests)\nresult = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)\nprint(f'run={result.testsRun}')\nprint(f'failures={len(result.failures)}, errors={len(result.errors)}, skipped={len(result.skipped)}')\nprint(f'success={result.wasSuccessful()}')",
          walkthrough: [
            { lines: "1-10", explanation: "표준 library와 두 production function을 준비하고 0 나눗셈을 명시 exception으로 만듭니다." },
            { lines: "12-25", explanation: "정상, exception message, 네 subTest case, 이유 있는 skip 네 test method를 정의합니다." },
            { lines: "28-29", explanation: "default loader로 suite를 만들고 runner 출력을 StringIO에 보내 시간·환경 표시를 숨깁니다." },
            { lines: "30-32", explanation: "안정적인 구조화 count와 success boolean만 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "unittest_contracts.py로 저장"], command: "python unittest_contracts.py" },
          output: { value: "run=4\nfailures=0, errors=0, skipped=1\nsuccess=True", explanation: ["subTest 네 case가 있어도 test method 기준 testsRun은 4입니다.", "skip은 failure/error가 아니며 wasSuccessful은 True입니다.", "실패가 생기면 result 구조에 traceback tuple이 보존됩니다."] },
          experiments: [
            { change: "is_even(3)의 expected를 True로 바꿉니다.", prediction: "한 subTest failure가 기록되고 나머지 case도 실행되며 success=False입니다.", result: "subTest가 입력별 진단을 계속 수집합니다." },
            { change: "skip decorator를 제거합니다.", prediction: "future test가 failure가 되어 run=4, failures=1, skipped=0입니다.", result: "skip은 test 부채를 실제 gate에서 제외하므로 관리가 필요합니다." },
          ],
          sourceRefs: ["py-unittest-basic-source", "py-unittest-advanced-source", "python-unittest-doc"],
        },
      ],
      diagnostics: [
        { symptom: "setUp에서 자원을 연 뒤 중간 실패해 tearDown이 실행되지 않고 누수된다.", likelyCause: "setup 완료 전에 실패하면 일반 tearDown에만 의존한 cleanup이 등록되지 않습니다.", checks: ["setUp 단계별 실패를 주입합니다.", "addCleanup 등록 시점을 확인합니다.", "resource count를 전후 비교합니다."], fix: "획득 직후 addCleanup 또는 context manager/ExitStack에 정리를 등록합니다.", prevention: "setup fault-injection test와 resource leak metric을 둡니다." },
      ],
    },
    {
      id: "pytest-toolbox",
      title: "pytest는 plain assert rewriting·fixture dependency graph·parametrize로 간결한 test 조합을 제공합니다",
      lead: "함수·파일 naming convention으로 discovery하고 assertion expression을 분석해 실제·기대 diff를 보여 줍니다.",
      explanations: [
        "원본 test_calc_pytest는 add·subtract, raises, approx, 네 is_even parameter, fixture test로 총 node 9개가 통과합니다. parametrize 각 case는 독립 test node라 개별 ID·선택·report가 가능합니다.",
        "fixture는 함수 인수 이름으로 dependency를 요청하고 scope function/class/module/session을 가집니다. 넓은 scope mutable fixture는 test 간 오염을 만들 수 있습니다. yield fixture의 yield 뒤 cleanup도 setup 실패 단계와 dependency 역순을 이해합니다.",
        "pytest.approx는 relative·absolute tolerance를 지원합니다. tolerance를 결과에 맞춰 넓게 잡지 말고 domain 허용 오차를 근거로 정합니다. exception은 pytest.raises(match=...)와 excinfo.value 구조를 검증합니다.",
        "marker로 slow·integration·network를 분류하고 strict-markers로 오타를 막습니다. plugin이 강력하지만 environment·hook behavior를 바꿀 수 있으므로 version lock과 최소 plugin을 사용합니다.",
      ],
      concepts: [
        { term: "fixture", definition: "test가 이름으로 요청하는 준비 data·dependency·자원과 cleanup lifecycle을 제공하는 pytest 함수입니다.", detail: ["dependency graph로 조합됩니다.", "scope와 mutation 격리를 관리합니다."] },
        { term: "parametrize", definition: "하나의 test function을 여러 input·expected set으로 독립 test node로 생성하는 pytest marker입니다.", detail: ["case ID를 지정할 수 있습니다.", "경계 table을 간결하게 표현합니다."] },
      ],
      codeExamples: [
        {
          id: "pytest-parametrize-fixture",
          title: "pytest로 9개 node를 만드는 원본형 contract suite",
          language: "python",
          filename: "test_calc_contract.py",
          purpose: "plain assert·raises·approx·4개 parametrize·fixture가 discovery에서 독립 node로 집계되는 구조를 보여 줍니다.",
          code: "import pytest\n\ndef add(a, b): return a + b\ndef subtract(a, b): return a - b\ndef divide(a, b):\n    if b == 0:\n        raise ValueError('0으로 나눌 수 없습니다.')\n    return a / b\ndef is_even(n): return n % 2 == 0\n\ndef test_add(): assert add(2, 3) == 5\ndef test_subtract(): assert subtract(10, 4) == 6\ndef test_divide_by_zero():\n    with pytest.raises(ValueError, match='0으로'):\n        divide(10, 0)\ndef test_float(): assert divide(1, 3) == pytest.approx(0.3333, abs=1e-4)\n\n@pytest.mark.parametrize('n,expected', [(2, True), (3, False), (0, True), (-4, True)])\ndef test_is_even(n, expected): assert is_even(n) is expected\n\n@pytest.fixture\ndef sample_numbers(): return [10, 20, 30]\ndef test_with_fixture(sample_numbers): assert sum(sample_numbers) == 60",
          walkthrough: [
            { lines: "1-9", explanation: "pytest와 네 production function을 한 학습 파일에 두었지만 실제 project에서는 calc module로 분리합니다." },
            { lines: "11-16", explanation: "두 일반 결과, 구체 exception message, float tolerance 네 node를 만듭니다." },
            { lines: "18-19", explanation: "한 function에 네 parameter set이 있어 네 독립 node가 됩니다." },
            { lines: "21-23", explanation: "fixture를 주입받는 합계 test 한 node를 더해 총 9개입니다." },
          ],
          run: { environment: ["Python 3.8 이상", "pytest 설치", "test_calc_contract.py로 저장"], command: "python -m pytest -q -p no:cacheprovider test_calc_contract.py" },
          output: { value: "......... [100%]\n9 passed", explanation: ["두 기본+예외+float 4개, parametrize 4개, fixture 1개로 총 9 node입니다.", "실제 pytest 출력의 실행 시간은 환경마다 달라 normalized 결과에서 생략했습니다.", "-p no:cacheprovider는 학습 폴더에 .pytest_cache를 남기지 않습니다."] },
          experiments: [
            { change: "is_even의 3 expected를 True로 바꿉니다.", prediction: "해당 parameter node 하나만 명확한 ID와 assertion diff로 실패합니다.", result: "parametrize가 case 독립 reporting을 제공합니다." },
            { change: "fixture scope='session'으로 하고 list를 test에서 변경합니다.", prediction: "후속 test가 변경된 같은 list를 보아 순서 의존 실패가 생길 수 있습니다.", result: "넓은 fixture scope의 mutable state를 피하거나 copy/reset합니다." },
          ],
          sourceRefs: ["py-pytest-source", "pytest-doc"],
        },
      ],
      diagnostics: [
        { symptom: "pytest에서는 import되는데 IDE·unittest·CI에서 module을 못 찾거나 반대다.", likelyCause: "실행 command·cwd·import mode가 sys.path를 다르게 구성하고 project가 설치되지 않았습니다.", checks: ["sys.executable·cwd·sys.path[0]을 비교합니다.", "python -m pytest와 pytest executable을 비교합니다.", "editable install·src layout·package name collision을 확인합니다."], fix: "project를 package로 설치하고 대상 interpreter의 python -m pytest를 사용하며 import mode/config를 CI와 local에 통일합니다.", prevention: "clean venv의 동일 command를 developer script와 CI가 공유합니다." },
      ],
    },
    {
      id: "ci-coverage-flakiness-supply-chain",
      title: "CI는 깨끗한 환경에서 lock·type·lint·test·coverage·보안 증거를 반복 생성합니다",
      lead: "로컬 한 번 통과보다 새 environment·지원 Python matrix·병렬 실행에서도 결정적인 결과가 품질 계약입니다.",
      explanations: [
        "CI는 checkout 후 지정 Python version, locked dependency install, type/lint/test 순서와 artifact를 선언합니다. cache는 성능 최적화이며 lock key가 맞지 않으면 stale dependency를 숨길 수 있습니다. 주기적으로 cache 없는 실행을 합니다.",
        "coverage는 실행된 line/branch 비율이지 올바른 assertion 증거가 아닙니다. 중요한 contract·error·security boundary의 branch를 목표로 하고 100% 숫자를 위해 무의미 test를 만들지 않습니다. mutation testing으로 assertion 민감도를 보완할 수 있습니다.",
        "flaky test를 무조건 retry해 green으로 만들면 race·time·shared state를 숨깁니다. 실패 seed·환경·order를 보존하고 quarantine에는 owner·issue·만료를 둡니다. time.sleep 대신 condition/polling with deadline을 사용합니다.",
        "dependency audit·license·secret scan·hash·trusted index는 test와 다른 supply-chain gate입니다. lock update를 자동 PR로 만들고 changelog·test matrix를 검토합니다. CI token은 최소 권한·fork 격리를 적용합니다.",
      ],
      concepts: [
        { term: "hermetic test", definition: "외부 network·사용자 환경·실시간·shared state 의존을 통제해 선언된 입력과 dependency만으로 반복 가능한 test입니다.", detail: ["완전 격리 정도를 명시합니다.", "integration test는 통제된 service를 provision합니다."] },
        { term: "flaky test", definition: "code·입력이 같아도 timing·race·order·환경 때문에 pass/fail이 바뀌는 test입니다.", detail: ["retry로 숨기지 않습니다.", "seed·order·artifact를 보존해 원인을 제거합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "CI에서만 가끔 실패하고 재실행하면 통과한다.", likelyCause: "time·random·parallel shared state·port·filesystem order·resource race 같은 비결정 dependency가 있습니다.", checks: ["실패 seed·test order·worker·platform을 보존합니다.", "병렬/반복/order-randomized 실행으로 재현합니다.", "sleep·global fixture·정렬 없는 결과를 찾습니다."], fix: "clock/RNG/port/temp dir를 주입·격리하고 condition을 deadline으로 기다리며 공유 state를 제거합니다.", prevention: "반복 stress·parallel CI와 flaky ownership 정책을 둡니다." },
      ],
      comparisons: [
        { title: "어떤 test 도구를 선택할까요?", options: [
          { name: "unittest", chooseWhen: "표준 library만으로 class lifecycle·기존 xUnit style·배포 dependency 최소화가 중요할 때", avoidWhen: "fixture 조합·parameter node·plugin ecosystem이 핵심일 때", tradeoffs: ["Python에 기본 포함됩니다.", "TestCase boilerplate가 있습니다.", "mock·discovery와 안정된 API를 제공합니다."] },
          { name: "pytest", chooseWhen: "간결 assert·fixture graph·parametrize·marker·plugin이 필요한 application test일 때", avoidWhen: "외부 dependency를 전혀 허용하지 않는 library bootstrap test", tradeoffs: ["표현력과 failure diff가 좋습니다.", "plugin/version/config 영향이 있습니다.", "fixture scope를 이해해야 합니다."] },
          { name: "doctest/간단 script", chooseWhen: "문서 예제와 작은 smoke demonstration을 검증할 때", avoidWhen: "복잡 fixture·정밀 오류·대규모 regression suite", tradeoffs: ["문서와 예제를 가깝게 둡니다.", "출력 formatting에 취약할 수 있습니다.", "주요 suite의 보조로 사용합니다."] },
        ] },
      ],
      expertNotes: ["재현 가능한 build는 dependency version뿐 아니라 wheel hash·base image digest·system library·locale·timezone·CPU/GPU metadata를 artifact provenance와 SBOM에 기록합니다.", "test가 production secret·network를 사용하지 않도록 CI environment approval·OIDC short-lived credential·egress control을 적용하고 fork PR에는 privileged workflow를 분리합니다."],
    },
  ],
  lab: {
    title: "깨끗한 환경에서 재현되는 calc package 품질 gate",
    scenario: "calc를 installable package로 만들고 locked venv에서 unittest·pytest·type·coverage를 같은 명령으로 실행하는 local/CI workflow를 구축합니다.",
    setup: ["pyproject.toml, src/study_calc, tests/unit, tests/integration 구조를 만듭니다.", "새 TemporaryDirectory 또는 별도 실습 폴더에서 작업합니다.", "지원 Python version matrix를 명시합니다."],
    steps: ["현재 sys.executable·version·prefix를 machine-readable environment report로 만듭니다.", "새 venv를 만들고 그 interpreter의 -m pip로 build/test tool을 설치합니다.", "direct dependency 범위와 resolved lock/hash를 분리합니다.", "calc 함수에 type annotation·doc contract를 넣고 import side effect를 없앱니다.", "unittest로 표준 library 최소 suite, pytest로 parametrize·fixture suite를 작성합니다.", "0 나눗셈 exception class·message·state를 검증합니다.", "float tolerance 근거와 negative/large/bool input 정책을 test합니다.", "CI에서 clean install→type→lint→unit→integration→coverage→audit를 matrix 실행합니다.", "failure seed·JUnit XML·coverage·environment·lock diff를 artifact로 남깁니다.", "cache 없는 재생성과 dependency update PR test를 추가합니다."],
    expectedResult: ["로컬과 CI가 같은 explicit interpreter command를 사용합니다.", "깨끗한 venv 설치에서 package import와 모든 test가 통과합니다.", "unittest 5개·고급 skip·pytest 9 node의 원본 행동이 보존됩니다.", "test 순서·병렬 실행·다른 cwd에 의존하지 않습니다.", "dependency resolution과 environment provenance가 artifact로 남습니다.", "coverage 숫자뿐 아니라 예외·경계 contract가 assertion으로 검증됩니다."],
    cleanup: ["생성 venv·build·coverage·pytest cache를 안전하게 실습 폴더 안에서 제거합니다."],
    extensions: ["property-based test와 mutation test를 추가합니다.", "wheel을 build해 새 venv에서 install/test합니다.", "SBOM·signature·provenance attestation을 생성합니다.", "OS·Python version·architecture matrix와 최소 지원 version을 검증합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 day15·day16 환경·test를 같은 interpreter에서 재현하세요.", requirements: ["sys.executable·prefix/base_prefix·환경 변수·sys.path를 기록합니다.", "importlib.metadata로 target 설치/미설치를 확인합니다.", "unittest 기본 5 성공, 고급 3 성공+1 skip을 실행합니다.", "pytest 9 node를 cache 없이 실행합니다.", "python과 python -m pip/pytest 경로가 같은 환경인지 확인합니다."], hints: ["출력 path는 공개 report에서 마스킹합니다.", "실행 시간은 exact golden에서 제외합니다."], expectedOutcome: "환경 identity와 원본 test 증거를 직접 재현합니다.", solutionOutline: ["현재 환경을 먼저 report합니다.", "새 venv에서 반복합니다.", "차이를 package/version 표로 정리합니다."] },
    { difficulty: "응용", prompt: "CSV 변환 project를 package·test 가능한 구조로 바꾸세요.", requirements: ["src layout과 pyproject dependency를 만듭니다.", "file I/O와 순수 row transform을 분리합니다.", "TemporaryDirectory fixture·parametrize·예외·atomic output을 test합니다.", "Python version·lock·CLI entry point를 검증합니다.", "clean venv와 다른 cwd에서 동일하게 통과합니다."], hints: ["requirements parser를 직접 regex로 재구현하지 않습니다.", "실제 사용자 파일을 fixture로 수정하지 않습니다."], expectedOutcome: "학습 script를 재현 가능한 installable/tested package로 전환합니다." },
    { difficulty: "설계", prompt: "기업 Python mono-repo의 환경·test·CI 전략을 설계하세요.", requirements: ["project별/공유 venv·lock·workspace dependency 정책을 비교합니다.", "Python/OS/service matrix와 cache key·artifact를 정의합니다.", "unit/contract/integration/e2e·flaky quarantine·coverage gate를 설계합니다.", "private index·hash·SBOM·license·vulnerability update를 포함합니다.", "type/lint/test tool version과 plugin governance를 정합니다.", "fork PR secret 격리·OIDC·최소 권한·egress를 포함합니다."], hints: ["하나의 거대한 freeze가 모든 project 목적에 맞지 않을 수 있습니다.", "cache hit와 reproducible clean build를 구분합니다."], expectedOutcome: "venv·test 문법을 조직 규모의 공급망·품질·운영 feedback loop로 확장합니다." },
  ],
  reviewQuestions: [
    { question: "가상환경 여부의 기본 증거는 무엇인가요?", answer: "실행 중 sys.executable과 sys.prefix != sys.base_prefix를 확인하며 환경 종류에 따라 추가 metadata를 봅니다." },
    { question: "activation을 하지 않으면 venv를 사용할 수 없나요?", answer: "아닙니다. venv의 Python executable을 직접 호출하면 activation 없이 정확히 사용할 수 있습니다." },
    { question: "pip install 이름과 import 이름은 항상 같나요?", answer: "아닙니다. distribution과 import package 이름이 다를 수 있습니다." },
    { question: "pip freeze는 무엇을 보장하고 무엇을 놓치나요?", answer: "현재 설치 snapshot을 기록하지만 direct/transitive 이유·OS dependency·artifact hash·다른 platform resolution을 자동 설명하지 않습니다." },
    { question: "unittest subTest 네 case는 testsRun 네 개로 세나요?", answer: "보통 하나의 test method로 집계되며 각 실패 case는 subTest context로 보고됩니다." },
    { question: "pytest parametrize 네 case는 어떻게 집계되나요?", answer: "각 parameter set이 독립 test node로 discovery·report됩니다." },
    { question: "coverage 100%면 bug가 없나요?", answer: "아닙니다. 실행 여부만 측정하며 assertion 품질·누락 요구·concurrency·보안은 별도입니다." },
    { question: "flaky test를 retry해 통과시키면 해결인가요?", answer: "아닙니다. seed·time·race·shared state 원인을 보존하고 제거해야 합니다." },
  ],
  completionChecklist: [
    "실제 interpreter·version·prefix·sys.path를 진단할 수 있다.",
    "venv를 생성·재생성하고 explicit Python -m pip를 사용할 수 있다.",
    "distribution/import 이름·version·optional dependency를 구분할 수 있다.",
    "requirements 범위·freeze·lock·hash·pyproject 목적을 설명할 수 있다.",
    "결정적인 AAA test와 정상·경계·예외 contract를 설계할 수 있다.",
    "unittest lifecycle·assert·subTest·skip을 사용할 수 있다.",
    "pytest fixture·parametrize·raises·approx·marker를 사용할 수 있다.",
    "clean CI matrix·coverage·flaky·dependency 공급망 gate를 설계할 수 있다.",
  ],
  nextSessions: ["gap-001"],
  sources: [
    { id: "py-env-info-source", repository: "PYTHON-BASIC", path: "day15_venv/ex01_env_info.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day15_venv/ex01_env_info.py", usedFor: ["sys.executable", "version", "prefix/base_prefix", "venv 환경 변수", "sys.path"], evidence: "원본 환경 진단 필드를 감사하고 path-dependent 출력은 개념·privacy 설명으로 분리했습니다." },
    { id: "py-installed-packages-source", repository: "PYTHON-BASIC", path: "day15_venv/ex02_installed_packages.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day15_venv/ex02_installed_packages.py", usedFor: ["importlib.metadata version/distributions", "PackageNotFoundError", "import availability"], evidence: "target package 설치/미설치와 전체 distribution metadata 조회 흐름을 감사했습니다." },
    { id: "py-requirements-source", repository: "PYTHON-BASIC", path: "day15_venv/ex03_requirements.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day15_venv/ex03_requirements.py", usedFor: ["requirements 읽기", "specifier", "설치 version 대조", "pip install/freeze"], evidence: "원본 단순 requirements 해석을 감사하고 표준 parser·lock·hash·pyproject 한계로 확장했습니다." },
    { id: "py-calc-source", repository: "PYTHON-BASIC", path: "day16_test/calc.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day16_test/calc.py", usedFor: ["test 대상 module", "add·subtract·divide·is_even", "0 exception contract"], evidence: "production 기능이 test module과 분리된 구조와 ValueError 계약을 확인했습니다." },
    { id: "py-unittest-basic-source", repository: "PYTHON-BASIC", path: "day16_test/ex01_unittest_basic.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day16_test/ex01_unittest_basic.py", usedFor: ["TestCase", "setUp", "assert", "assertRaises", "main guard"], evidence: "Python 3.13.9에서 5 test 모두 성공함을 직접 실행 확인했습니다." },
    { id: "py-unittest-advanced-source", repository: "PYTHON-BASIC", path: "day16_test/ex02_unittest_advanced.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day16_test/ex02_unittest_advanced.py", usedFor: ["assertAlmostEqual", "subTest", "skip", "추가 assertion"], evidence: "Python 3.13.9에서 4 method 중 3 성공·1 skip 결과를 직접 실행 확인했습니다." },
    { id: "py-pytest-source", repository: "PYTHON-BASIC", path: "day16_test/test_calc_pytest.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day16_test/test_calc_pytest.py", usedFor: ["plain assert", "raises", "approx", "parametrize", "fixture"], evidence: "python -m pytest -q -p no:cacheprovider로 9 node가 모두 통과함을 직접 실행 확인했습니다." },
    { id: "python-venv-doc", repository: "Python documentation", path: "library/venv.html", publicUrl: "https://docs.python.org/3/library/venv.html", usedFor: ["venv 생성", "activation", "prefix", "이동 불가·재생성"], evidence: "공식 venv 문서를 환경 수명·interpreter 선택의 기준으로 사용했습니다." },
    { id: "python-unittest-doc", repository: "Python documentation", path: "library/unittest.html", publicUrl: "https://docs.python.org/3/library/unittest.html", usedFor: ["TestCase lifecycle", "assert", "subTest", "skip", "runner result"], evidence: "공식 unittest API로 안정 summary example과 cleanup 설명을 검증했습니다." },
    { id: "pytest-doc", repository: "pytest documentation", path: "how-to/index.html", publicUrl: "https://docs.pytest.org/en/stable/how-to/index.html", usedFor: ["assert", "fixture", "parametrize", "raises", "approx", "discovery"], evidence: "pytest 공식 사용 문서를 원본 suite 확장과 fixture/parametrize contract의 기준으로 사용했습니다." },
  ],
  sourceCoverage: { filesRead: 7, filesUsed: 7, uncoveredNotes: ["특정 lock tool·build backend·CI vendor 문법은 project 선택 뒤 공식 문서로 별도 적용합니다.", "hash/SBOM·hermetic CI·flaky governance·supply-chain permission은 원본 venv/test 예제를 전문가 delivery 수준으로 보강한 내용입니다."] },
} satisfies DetailedSession;

const expertChapters: DetailedSession["chapters"] = [
  {
    id: "pyproject-lock-hash-reproducibility",
    title: "pyproject·lock·artifact hash로 설치 입력을 재현 가능한 단위로 고정합니다",
    lead: "venv는 격리 공간만 만들 뿐 같은 package graph를 보장하지 않으므로 project metadata, 모든 transitive version과 실제 artifact hash를 함께 고정해야 합니다.",
    explanations: [
      "pyproject.toml은 build-system과 project metadata, tool 설정의 표준 진입점입니다. requires-python과 dependency marker·extra가 어떤 interpreter/platform에서 다른 graph를 만드는지 review합니다.",
      "requirements의 pkg>=1 같은 범위는 시간이 지나 다른 version을 선택하므로 배포 재현용 lock은 직접·transitive dependency의 exact version과 source artifact를 고정합니다.",
      "pip --require-hashes는 모든 requirement가 hash를 갖도록 요구해 예상하지 않은 artifact를 거부합니다. 한 version에 여러 wheel을 허용한다면 지원 platform의 각 artifact hash를 명시합니다.",
      "hash는 artifact integrity를 확인하지만 package가 신뢰할 수 있거나 악성 code가 없음을 증명하지 않습니다. index provenance, signing/attestation, dependency review와 취약점 대응을 별도로 수행합니다.",
      "lock 생성 환경과 install 환경의 Python·OS·architecture·index URL·resolver version을 기록하고 offline wheelhouse 또는 immutable artifact repository를 사용하면 외부 drift를 줄일 수 있습니다.",
    ],
    concepts: [
      { term: "lock file", definition: "선택된 직접·transitive dependency version과 환경 조건을 재현 가능하게 기록한 설치 입력입니다.", detail: ["version range와 목적이 다릅니다.", "platform별 graph를 표현해야 할 수 있습니다."] },
      { term: "hash-checking mode", definition: "pip가 내려받은 distribution artifact의 digest가 requirement에 허용된 hash와 일치하는지 강제하는 모드입니다.", detail: ["--require-hashes로 활성화할 수 있습니다.", "신뢰성 검토를 대신하지 않습니다."] },
    ],
    codeExamples: [{
      id: "pyproject-lock-hash-manifest",
      title: "pyproject metadata와 고정 version·artifact hash manifest를 생성합니다",
      language: "python",
      filename: "reproducible_manifest.py",
      purpose: "실제 package 설치 없이 표준 tomllib·hashlib로 reproducibility 입력의 구조를 exact output으로 확인합니다.",
      code: String.raw`import hashlib
import tomllib

pyproject_text = """
[project]
name = "study-demo"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = ["requests==2.32.5", "rich==14.1.0"]

[build-system]
requires = ["setuptools==80.9.0"]
build-backend = "setuptools.build_meta"
"""

project = tomllib.loads(pyproject_text)["project"]
print("project:", project["name"], project["version"])
print("python:", project["requires-python"])
print("dependencies:", sorted(project["dependencies"]))

artifact = b"study-demo-wheel-bytes-v1"
digest = hashlib.sha256(artifact).hexdigest()
lock_line = f"study-demo==1.0.0 --hash=sha256:{digest}"
print("lock_line:", lock_line)
print("pinned:", "==" in lock_line, "--hash=sha256:" in lock_line)
print("digest_length:", len(digest))`,
      walkthrough: [
        { lines: "1-14", explanation: "고정 version의 project·build metadata를 TOML 문자열로 준비합니다." },
        { lines: "16-19", explanation: "tomllib로 project metadata를 읽고 dependency 출력 순서를 결정적으로 정렬합니다." },
        { lines: "21-26", explanation: "합성 artifact bytes의 SHA-256을 계산해 exact pin과 hash가 있는 lock line을 만듭니다." },
      ],
      run: { environment: ["Python 3.13+", "실제 pip/network/filesystem 불필요", "합성 artifact"], command: "python -I -B -X utf8 reproducible_manifest.py" },
      output: { value: "project: study-demo 1.0.0\npython: >=3.11\ndependencies: ['requests==2.32.5', 'rich==14.1.0']\nlock_line: study-demo==1.0.0 --hash=sha256:741a0193f96dfc8b03788ba4aca96202e129a35f2cefc70eca38cd736dc877dd\npinned: True True\ndigest_length: 64", explanation: ["예제 hash는 합성 bytes에 대한 것으로 실제 wheel lock에는 실제 distribution hash를 사용해야 합니다.", "pyproject dependencies와 deploy lock은 목적이 달라 별도 관리될 수 있습니다."] },
      experiments: [
        { change: "requests pin을 >=2로 바꿉니다.", prediction: "미래 resolver 시점에 선택 version이 달라질 수 있습니다.", result: "개발 범위와 배포 lock을 구분합니다." },
        { change: "artifact bytes 한 글자를 바꿉니다.", prediction: "SHA-256 전체가 달라집니다.", result: "hash가 artifact integrity를 고정합니다." },
        { change: "top-level dependency만 lock합니다.", prediction: "transitive dependency version drift가 남습니다.", result: "완전한 graph lock이 필요합니다." },
      ],
      sourceRefs: ["py-installed-packages-source", "py-requirements-source", "packaging-pyproject-spec", "pip-repeatable-installs", "pip-hash-checking"],
    }],
    diagnostics: [
      { symptom: "새 venv인데 어제와 다른 dependency version이 설치된다.", likelyCause: "version range·transitive dependency·index artifact를 lock하지 않았습니다.", checks: ["pip report/freeze와 lock graph를 비교합니다.", "Python·platform marker와 index URL을 확인합니다.", "hash-checking mode 사용 여부를 봅니다."], fix: "검토된 환경별 lock과 artifact hash를 생성해 immutable source에서 설치합니다.", prevention: "scheduled lock update PR, clean-room install과 dependency diff를 CI에 둡니다." },
    ],
    expertNotes: ["예제 version은 교육 snapshot입니다. 실제 프로젝트에서는 자동 update가 제안한 최신 호환 version을 test·review하고 lock을 갱신합니다."],
  },
  {
    id: "test-layers-mock-property-coverage-ci-matrix",
    title: "fixture·mock·parametrization·property·coverage와 CI matrix를 위험 기반으로 조합합니다",
    lead: "테스트 도구의 개수보다 어떤 계약을 어느 격리 수준에서 검증하고 실패를 재현할 정보가 남는지가 중요합니다.",
    explanations: [
      "unittest fixture setUp/tearDown과 pytest fixture는 준비·정리를 재사용하지만 scope가 넓을수록 상태 누출 위험이 커집니다. mutable fixture를 test별 새로 만들고 cleanup을 실패 경로에서도 보장합니다.",
      "mock은 느리거나 비결정적인 경계의 interaction을 제어하지만 구현 세부 호출을 과도하게 고정하면 refactor에 취약합니다. protocol adapter 경계에서 call count·argument·retry 같은 observable contract만 검증합니다.",
      "pytest.mark.parametrize는 같은 assertion을 경계값 table에 적용하고 unittest.subTest는 loop case를 개별 failure context로 남깁니다. case ID에 입력 의미를 담아 CI에서 즉시 진단합니다.",
      "property-based test는 생성된 많은 입력에서 invariant와 metamorphic relation을 찾고 실패 예제를 축소합니다. seed/example database를 artifact로 보존하되 몇 개 example test와 통합해야 설명 가능성이 높습니다.",
      "coverage는 실행된 line/branch 비율이지 correctness 증명은 아닙니다. missing branch를 위험 기준으로 읽고 mutation test·negative test와 결합합니다.",
      "CI matrix는 지원 Python·OS·dependency 범위를 대표해야 합니다. 모든 조합의 비용이 크면 최소/최신 version, 주요 OS와 scheduled full matrix를 나누고 flaky retry로 실패를 숨기지 않습니다.",
    ],
    concepts: [
      { term: "interaction test", definition: "mock/fake를 통해 dependency가 어떤 argument·횟수·순서로 호출되는지 외부 observable contract를 검증하는 test입니다.", detail: ["adapter 경계에 제한합니다.", "내부 구현 세부를 과도하게 고정하지 않습니다."] },
      { term: "property-based testing", definition: "다양한 생성 입력에 대해 항상 성립해야 할 invariant를 검사하고 실패 입력을 축소하는 기법입니다.", detail: ["example test를 보완합니다.", "재현 seed·database를 보존합니다."] },
    ],
    codeExamples: [{
      id: "mock-param-property-ci-contracts",
      title: "Mock retry·table cases·property invariant와 CI matrix를 한 실행으로 검증합니다",
      language: "python",
      filename: "test_strategy_contracts.py",
      purpose: "third-party test runner 없이 표준 unittest.mock과 deterministic tables로 핵심 test 설계 결과를 확인합니다.",
      code: String.raw`from unittest.mock import Mock, call

def fetch_with_retry(fetch, attempts=3):
    for attempt in range(attempts):
        try:
            return fetch()
        except TimeoutError:
            if attempt == attempts - 1:
                raise

fetch = Mock(side_effect=[TimeoutError("slow"), {"status": "ok"}])
result = fetch_with_retry(fetch)
print("retry:", result, fetch.call_count, fetch.call_args_list == [call(), call()])

def clamp(value, low=0, high=100):
    return min(high, max(low, value))

cases = [(-1, 0), (0, 0), (50, 50), (100, 100), (101, 100)]
print("table:", [(value, clamp(value) == expected) for value, expected in cases])

domain = range(-200, 201)
idempotent = all(clamp(clamp(value)) == clamp(value) for value in domain)
bounded = all(0 <= clamp(value) <= 100 for value in domain)
monotonic = all(clamp(value) <= clamp(value + 1) for value in range(-200, 200))
print("properties:", idempotent, bounded, monotonic)

matrix = [
    ("3.11", "ubuntu"),
    ("3.13", "ubuntu"),
    ("3.13", "windows"),
]
print("matrix:", matrix)
print("coverage_targets:", ["success", "timeout-retry", "timeout-exhausted"])`,
      walkthrough: [
        { lines: "1-13", explanation: "TimeoutError 한 번 뒤 성공하는 Mock으로 retry 결과·호출 횟수·arguments를 검증합니다." },
        { lines: "15-19", explanation: "clamp 경계값 table을 parametrization 가능한 (input, expected) 구조로 실행합니다." },
        { lines: "21-25", explanation: "401개 정수에서 idempotence·boundedness·monotonic property를 확인합니다." },
        { lines: "27-33", explanation: "최소/최신 Python과 주요 OS CI matrix, coverage가 요구하는 실패 branch를 명시합니다." },
      ],
      run: { environment: ["Python 3.13+", "표준 unittest.mock만 사용", "stdin/network/filesystem 불필요"], command: "python -I -B -X utf8 test_strategy_contracts.py" },
      output: { value: "retry: {'status': 'ok'} 2 True\ntable: [(-1, True), (0, True), (50, True), (100, True), (101, True)]\nproperties: True True True\nmatrix: [('3.11', 'ubuntu'), ('3.13', 'ubuntu'), ('3.13', 'windows')]\ncoverage_targets: ['success', 'timeout-retry', 'timeout-exhausted']", explanation: ["Mock은 retry boundary의 observable call 계약만 고정합니다.", "property loop는 개념 demonstration이며 Hypothesis의 생성·shrinking을 대신하지 않습니다."] },
      experiments: [
        { change: "fetch side_effect를 TimeoutError 세 개로 바꿉니다.", prediction: "세 번째 뒤 TimeoutError가 전파되고 exhausted branch가 실행됩니다.", result: "coverage target별 별도 test가 필요합니다." },
        { change: "clamp의 max/min 순서를 깨뜨립니다.", prediction: "table 또는 property 중 하나가 실패합니다.", result: "example과 property test가 서로 보완합니다." },
        { change: "CI matrix에서 Windows를 제거합니다.", prediction: "path·encoding·shell 차이를 release 전 발견하지 못할 수 있습니다.", result: "지원 platform 위험에 따라 matrix를 선택합니다." },
      ],
      sourceRefs: ["py-calc-source", "python-unittest-doc", "pytest-doc", "hypothesis-property-doc", "coverage-branch-doc"],
    }],
    diagnostics: [
      { symptom: "coverage 100%인데 production edge case가 계속 실패한다.", likelyCause: "line 실행률을 assertion quality·branch·data contract 증명으로 오해했습니다.", checks: ["branch/mutation coverage와 assertion을 봅니다.", "실패 taxonomy별 negative test를 확인합니다.", "mock이 실제 adapter 차이를 숨기는지 검토합니다."], fix: "위험 기반 branch·property·integration contract test를 추가하고 coverage를 탐색 지표로 사용합니다.", prevention: "incident마다 빠진 invariant를 회귀 test와 threat model에 반영합니다." },
    ],
    expertNotes: ["property-based test의 실패 example database와 CI seed는 재현 artifact로 보존하되 개인정보가 생성 strategy에 들어가지 않도록 합성 domain을 사용합니다."],
  },
];

(session.chapters as DetailedSession["chapters"]).push(...expertChapters);
session.reviewQuestions.push(
  { question: "venv만 만들면 설치가 재현되나요?", answer: "아닙니다. interpreter와 package graph를 격리할 뿐 version·transitive dependency·artifact source를 lock하지 않습니다." },
  { question: "pyproject.toml과 deploy lock의 역할은 어떻게 다른가요?", answer: "pyproject는 project/build metadata와 허용 dependency를 기술하고 lock은 특정 환경에 실제 선택된 전체 graph와 artifact를 고정합니다." },
  { question: "pip hash-checking mode가 무엇을 보장하나요?", answer: "설치 artifact가 허용된 digest와 일치함을 검사하지만 package code의 신뢰성·취약점 부재를 보장하지는 않습니다." },
  { question: "mock을 어디에 제한하는 것이 좋은가요?", answer: "network·clock·random·외부 service 같은 protocol adapter 경계의 observable interaction에 제한하고 내부 구현 세부는 과도하게 고정하지 않습니다." },
  { question: "parametrized example과 property test는 어떻게 보완하나요?", answer: "example은 중요한 경계와 기대를 설명하고 property test는 넓은 생성 입력에서 invariant와 예상하지 못한 반례를 찾습니다." },
  { question: "coverage가 correctness 증명이 아닌 이유는 무엇인가요?", answer: "line이 실행됐다는 사실만 보여 줄 뿐 assertion의 정확성, 누락된 입력·branch와 요구사항 충족을 증명하지 않기 때문입니다." },
  { question: "CI matrix를 어떤 기준으로 구성하나요?", answer: "지원하는 최소/최신 Python, 주요 OS·architecture·dependency 조합의 위험과 비용을 기준으로 PR 핵심 matrix와 scheduled full matrix를 나눕니다." },
);
session.completionChecklist.push(
  "pyproject의 requires-python·build-system·dependency marker를 검토한다.",
  "직접·transitive exact version과 실제 distribution hash를 lock한다.",
  "clean venv와 immutable artifact source에서 hash-checking install을 재현한다.",
  "fixture scope와 cleanup을 최소화해 test 간 상태 누출을 막는다.",
  "mock은 adapter interaction contract에 제한하고 실제 integration test를 유지한다.",
  "경계 table·property invariant·failure seed를 함께 관리한다.",
  "branch coverage와 지원 Python/OS CI matrix를 위험 기반으로 설계한다.",
);
(session.sources as DetailedSession["sources"]).push(
  { id: "packaging-pyproject-spec", repository: "Python Packaging User Guide", path: "specifications/pyproject-toml/", publicUrl: "https://packaging.python.org/en/latest/specifications/pyproject-toml/", usedFor: ["pyproject", "build-system", "project metadata"], evidence: "공식 Python Packaging specification을 pyproject metadata·build-system 설명의 기준으로 사용했습니다." },
  { id: "pip-repeatable-installs", repository: "pip documentation", path: "topics/repeatable-installs/", publicUrl: "https://pip.pypa.io/en/stable/topics/repeatable-installs/", usedFor: ["version pin", "repeatable installation", "wheelhouse"], evidence: "공식 pip repeatable installs guide를 전체 graph 고정과 source artifact 정책에 사용했습니다." },
  { id: "pip-hash-checking", repository: "pip documentation", path: "topics/secure-installs/#hash-checking-mode", publicUrl: "https://pip.pypa.io/en/stable/topics/secure-installs/#hash-checking-mode", usedFor: ["--require-hashes", "artifact integrity"], evidence: "공식 pip secure installs 문서의 hash-checking mode 요구사항을 확인했습니다." },
  { id: "hypothesis-property-doc", repository: "Hypothesis documentation", path: "details.html", publicUrl: "https://hypothesis.readthedocs.io/en/latest/details.html", usedFor: ["property-based testing", "shrinking", "reproduction"], evidence: "Hypothesis 공식 문서를 생성 입력·shrinking·재현 설명에 사용했습니다." },
  { id: "coverage-branch-doc", repository: "Coverage.py documentation", path: "branch.html", publicUrl: "https://coverage.readthedocs.io/en/latest/branch.html", usedFor: ["branch coverage", "missing paths", "coverage limit"], evidence: "Coverage.py 공식 branch coverage 문서를 실행률과 correctness의 경계 설명에 사용했습니다." },
);

export default session;
