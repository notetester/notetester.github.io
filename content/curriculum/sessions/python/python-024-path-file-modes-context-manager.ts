import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["py-024"],
  slug: "python-024-path-file-modes-context-manager",
  courseId: "python",
  moduleId: "02-control-functions-io",
  order: 24,
  title: "경로·파일 모드·context manager",
  subtitle: "현재 작업 디렉터리와 파일 위치를 구분하고, 데이터 손실을 막는 모드·인코딩·자원 수명 계약으로 안전한 파일 입출력을 설계합니다.",
  level: "중급",
  estimatedMinutes: 140,
  coreQuestion: "개발 PC에서는 되던 파일 코드가 다른 실행 위치·운영체제·오류 상황에서도 같은 파일을 안전하게 읽고 쓰도록 경로와 자원 수명을 어떻게 설계할까요?",
  summary: "os.getcwd와 상대 경로 해석, os.path.join과 pathlib.Path를 실제 파일 수명과 연결합니다. r·w·a·x·b·t·+ 모드의 생성·절단·추가 의미, UTF-8과 newline 경계, read·readline·iteration의 메모리 차이를 다룹니다. with가 정상 종료·return·예외에도 close를 보장하는 흐름을 재현하고, 원자적 교체·동시 쓰기·path traversal·권한·민감 로그까지 초급 파일 예제를 운영 가능한 설계로 확장합니다.",
  objectives: [
    "현재 작업 디렉터리, 소스 파일 위치, 상대 경로의 기준을 구분하고 실행 위치가 달라질 때 실제 대상 경로를 예측할 수 있다.",
    "os.path.join과 pathlib.Path의 경로 구성 방식을 사용하고 문자열 연결과 경로 연산의 차이를 설명할 수 있다.",
    "r·w·a·x·b·t·+ 모드가 파일 존재 여부와 기존 내용에 미치는 영향을 선택 전에 설명할 수 있다.",
    "encoding과 newline을 데이터 형식 계약으로 명시하고 UnicodeDecodeError와 줄바꿈 차이를 진단할 수 있다.",
    "with context manager가 정상·예외 경로에서 __exit__를 통해 파일을 닫는 순서를 설명할 수 있다.",
    "전체 읽기와 줄 단위 iteration을 파일 크기·처리 방식에 맞게 선택할 수 있다.",
    "임시 파일 후 replace, 동시성 제어, 기준 디렉터리 검증으로 손상과 path traversal 위험을 줄일 수 있다.",
  ],
  prerequisites: [
    { title: "함수 계약·스코프·반환", reason: "파일 함수의 경로·인코딩·오류·부수 효과를 명시적 계약으로 설계합니다.", sessionSlug: "python-021-function-contract-scope-return" },
    { title: "문자열 표기·이스케이프·raw 문자열", reason: "Windows 역슬래시 문자열과 실제 파일 시스템 경로 객체를 구분합니다.", sessionSlug: "python-007-string-literals-escapes-raw" },
    { title: "break·continue·for·range", reason: "파일 line iteration과 조기 종료에서도 context manager 정리가 실행되는 흐름을 연결합니다.", sessionSlug: "python-019-break-continue-for-range" },
  ],
  keywords: ["Python", "file I/O", "pathlib", "os.path", "open", "file mode", "encoding", "UTF-8", "context manager", "with", "atomic write", "path traversal"],
  chapters: [
    {
      id: "path-reference-points",
      title: "상대 경로는 소스 파일이 아니라 현재 작업 디렉터리를 기준으로 해석됩니다",
      lead: "같은 ../data/sample01.txt 문자열도 어느 디렉터리에서 Python 프로세스를 시작했는지에 따라 다른 파일을 가리킵니다.",
      explanations: [
        "원본 ex02는 os.getcwd()를 출력하고 os.path.join('../data', 'sample01.txt')를 만듭니다. 파일을 day05 디렉터리에서 실행하면 상위 data를 가리키지만 프로젝트 루트에서 python day05/ex02_file.py로 실행하면 ../data는 프로젝트 바깥 data를 가리킬 수 있습니다. Python은 기본적으로 소스 파일 위치가 아니라 프로세스 current working directory를 상대 경로 기준으로 사용합니다.",
        "개발 도구·테스트 runner·웹 서버·cron·GitHub Actions는 서로 다른 cwd에서 프로그램을 시작할 수 있습니다. '내 컴퓨터에서는 됨' 문제를 줄이려면 어떤 기준을 원하는지 먼저 정합니다. 사용자 실행 위치가 의미라면 Path.cwd(), 코드에 포함된 resource라면 Path(__file__).resolve().parent, 사용자 data라면 설정·환경·OS 전용 data 디렉터리를 사용합니다.",
        "진단할 때는 추측하지 말고 Path.cwd(), 입력 Path, path.resolve(strict=False)를 함께 기록합니다. 다만 절대 경로는 사용자 이름·서버 구조를 노출할 수 있으므로 공개 로그와 에러 화면에서는 기준 이름과 상대 식별자만 남기고 민감 부분을 마스킹합니다.",
        "chdir로 전역 cwd를 바꾸면 이후 모든 상대 경로와 library가 영향을 받습니다. 작은 일회성 script가 아니라면 cwd 변경보다 기준 Path를 하나 만들고 모든 하위 경로를 그 객체에서 조합하는 방식이 예측 가능하고 동시 실행에도 안전합니다.",
      ],
      concepts: [
        { term: "current working directory", definition: "프로세스가 상대 경로를 해석할 때 사용하는 현재 디렉터리이며 Path.cwd 또는 os.getcwd로 확인합니다.", detail: ["소스 파일이 있는 디렉터리와 같다는 보장이 없습니다.", "프로세스 시작 방식이나 chdir에 따라 달라질 수 있습니다."] },
        { term: "상대 경로", definition: "루트나 drive부터 완전히 지정하지 않고 현재 기준점에서 이동해 대상을 표현하는 경로입니다.", detail: ["../는 부모 디렉터리로 이동합니다.", "해석 후 실제 경로가 허용 기준 안에 있는지 보안 검증이 필요할 수 있습니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "IDE에서는 파일을 찾지만 터미널·테스트·배포에서는 FileNotFoundError가 발생한다.", likelyCause: "상대 경로가 소스 위치 기준이라고 가정했지만 실행 방식마다 cwd가 다릅니다.", checks: ["실패 환경에서 Path.cwd를 확인합니다.", "입력 경로와 resolve 결과를 비교합니다.", "파일이 코드 resource인지 사용자 data인지 분류합니다."], fix: "목적에 맞는 기준 Path를 명시하고 그 기준에서 하위 경로를 조합합니다. 배포 설정에는 data 경로를 환경·설정으로 전달합니다.", prevention: "테스트를 서로 다른 cwd에서 실행하고 source-relative·cwd-relative 계약을 문서화합니다." },
      ],
    },
    {
      id: "path-construction",
      title: "경로는 문자열 조각이 아니라 운영체제 규칙을 가진 Path 값으로 다룹니다",
      lead: "os.path.join과 pathlib의 / 연산자는 구분자·부모·이름·suffix 같은 경로 의미를 보존합니다.",
      explanations: [
        "원본은 os.path.join('../data', 'sample01.txt')로 운영체제에 맞는 경로를 만듭니다. '../data/' + filename처럼 직접 연결하면 구분자 누락·중복, Windows와 POSIX 차이가 생깁니다. pathlib에서는 base / 'sample01.txt'처럼 구성하고 name, stem, suffix, parent를 의미 있는 속성으로 읽을 수 있습니다.",
        "Path는 경로를 표현한다고 파일이 자동 생성되거나 존재 검증되는 것은 아닙니다. Path('missing.txt') 객체도 만들 수 있습니다. exists, is_file, is_dir는 특정 시점의 상태를 관찰할 뿐이고 확인 직후 다른 프로세스가 파일을 바꿀 수 있습니다. 실제 open을 시도하고 예외를 처리하는 것이 최종 경계입니다.",
        "resolve는 ..와 symlink를 포함한 경로를 정규화해 실제 위치 검증에 도움을 줍니다. 그러나 strict 옵션, 존재하지 않는 마지막 구성 요소, 운영체제 symlink 권한을 이해해야 합니다. 단순 문자열 startswith로 기준 디렉터리 포함 여부를 확인하면 /safe/data2가 /safe/data로 시작하는 문제도 생기므로 Path.relative_to 또는 is_relative_to를 사용합니다.",
        "파일 이름을 사용자 입력으로 받을 때 Path(base) / user_name만 만들고 끝내지 않습니다. 절대 경로가 뒤에 오면 앞 base를 무시할 수 있고 ../로 탈출할 수 있습니다. 허용 문자·확장자를 제한하고 resolve한 후보가 resolve한 base 안인지 확인하며 symlink 정책도 정합니다.",
      ],
      concepts: [
        { term: "pathlib.Path", definition: "파일 시스템 경로를 구성·분해·탐색·입출력하는 객체 지향 표준 라이브러리 추상화입니다.", detail: ["운영체제별 구분자를 처리합니다.", "파일 존재와 경로 표현은 별개입니다."] },
        { term: "path traversal", definition: "외부 입력의 ../·절대경로·symlink 등을 이용해 허용 기준 디렉터리 밖 파일에 접근하는 취약점입니다.", detail: ["resolve 후 기준 포함 검증과 이름 whitelist가 필요합니다.", "읽기뿐 아니라 덮어쓰기·삭제 경로에서 더 위험합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "사용자 파일 이름을 붙였는데 기준 폴더 밖 파일이 읽히거나 덮어써진다.", likelyCause: "../, 절대 경로 또는 symlink를 포함한 입력을 검증 없이 base와 결합했습니다.", checks: ["원본 입력과 resolve된 후보를 비교합니다.", "candidate.is_relative_to(base.resolve())를 확인합니다.", "symlink와 Windows drive·UNC 경계를 테스트합니다."], fix: "허용 이름·suffix를 제한하고 resolve된 후보가 기준 내부인지 검증하며 쓰기 경계에서는 symlink와 기존 파일 정책까지 확인합니다.", prevention: "../·절대 경로·인코딩 변형·symlink를 포함한 보안 테스트를 추가합니다." },
      ],
    },
    {
      id: "file-modes",
      title: "파일 모드는 기존 데이터에 어떤 일이 일어나는지 먼저 말해 줍니다",
      lead: "특히 w는 open이 성공하는 순간 기존 내용을 잘라내므로 write 전에 예외가 나도 원본이 이미 비어 있을 수 있습니다.",
      explanations: [
        "r은 읽기 전용이며 파일이 없으면 FileNotFoundError입니다. w는 쓰기 전용으로 파일이 없으면 만들고 있으면 길이를 0으로 줄인 뒤 새로 씁니다. a는 없으면 만들고 있으면 끝에 추가합니다. 원본 ex02가 sample01을 10행으로 다시 만들고 ex03이 sample02에 실행할 때마다 10행씩 누적하는 이유입니다.",
        "x는 exclusive creation이라 파일이 이미 있으면 FileExistsError입니다. 기존 결과를 실수로 덮어쓰면 안 되는 export·migration에서 유용합니다. +는 읽기와 쓰기를 모두 허용하지만 file pointer 위치·flush·seek 규칙이 복잡해집니다. 단순히 두 기능이 필요하다는 이유만으로 r+나 a+를 선택하지 말고 데이터 갱신 전략을 먼저 정합니다.",
        "b는 bytes를 읽고 쓰는 binary mode, t는 str과 encoding을 사용하는 text mode이며 t가 기본입니다. 이미지·압축·모델 파일은 rb·wb, CSV·JSON·소스 텍스트는 명시 encoding의 text mode를 사용합니다. bytes를 text 파일에 write하거나 str을 binary 파일에 write하면 TypeError입니다.",
        "a 모드는 각 write가 파일 끝으로 향하지만 여러 프로세스가 여러 조각을 동시에 쓰면 논리적 record가 섞일 수 있습니다. JSON document처럼 전체 구조가 하나인 형식에는 append가 유효하지 않을 수 있습니다. 로그는 logging handler와 회전·lock 정책을 사용하고 데이터 갱신은 DB나 원자적 파일 교체를 고려합니다.",
      ],
      concepts: [
        { term: "truncate", definition: "기존 파일 길이를 0으로 줄여 내용을 제거하는 동작이며 w mode open에서 발생합니다.", detail: ["첫 write보다 먼저 일어날 수 있습니다.", "중요 파일은 임시 파일 후 교체와 backup 정책을 사용합니다."] },
        { term: "exclusive creation", definition: "대상 파일이 없을 때만 새로 만들고 이미 존재하면 실패하는 x mode 계약입니다.", detail: ["check-then-create 경쟁을 줄입니다.", "충돌 시 덮어쓰기 대신 FileExistsError를 처리합니다."] },
      ],
      codeExamples: [
        {
          id: "write-append-read-path",
          title: "임시 디렉터리에서 w·a·r 수명을 재현",
          language: "python",
          filename: "file_modes.py",
          purpose: "실제 사용자 파일을 건드리지 않고 디렉터리 생성, 덮어쓰기, 추가, 줄 단위 읽기 결과를 확인합니다.",
          code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\n\nwith TemporaryDirectory() as temp_dir:\n    path = Path(temp_dir) / 'notes' / 'study.txt'\n    path.parent.mkdir(parents=True, exist_ok=True)\n\n    with path.open('w', encoding='utf-8', newline='') as file:\n        file.write('1. Python\\n')\n        file.write('2. 함수\\n')\n\n    with path.open('a', encoding='utf-8', newline='') as file:\n        file.write('3. 파일\\n')\n\n    with path.open('r', encoding='utf-8') as file:\n        lines = [line.rstrip('\\n') for line in file]\n\n    print(f'name={path.name}, exists={path.exists()}')\n    print(lines)\n    print(f'bytes={path.stat().st_size}, lines={len(lines)}')",
          walkthrough: [
            { lines: "1-5", explanation: "TemporaryDirectory로 자동 정리되는 격리 공간을 만들고 Path / 연산자로 하위 경로를 구성합니다." },
            { lines: "6", explanation: "부모 notes 디렉터리가 없으므로 parents=True로 계층을 만들고 이미 있어도 허용합니다." },
            { lines: "8-10", explanation: "w mode가 새 파일을 만들고 두 줄을 씁니다. 블록을 나오며 flush와 close가 실행됩니다." },
            { lines: "12-13", explanation: "a mode는 기존 두 줄을 보존하고 세 번째 줄을 끝에 추가합니다." },
            { lines: "15-16", explanation: "파일 객체를 iteration해 한 줄씩 읽고 줄 끝 개행만 제거합니다." },
            { lines: "18-20", explanation: "무작위 임시 절대 경로 대신 안정적인 name·존재·내용·UTF-8 byte 크기·행 수를 출력합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "file_modes.py로 저장"], command: "python file_modes.py" },
          output: { value: "name=study.txt, exists=True\n['1. Python', '2. 함수', '3. 파일']\nbytes=30, lines=3", explanation: ["UTF-8에서 한글 한 글자는 대체로 3 bytes여서 문자 수와 file byte 크기는 다르며 이 실행 파일은 30 bytes입니다.", "a로 추가한 세 번째 줄이 기존 두 줄 뒤에 남습니다.", "TemporaryDirectory 블록 뒤에는 디렉터리와 파일이 자동 제거됩니다."] },
          experiments: [
            { change: "두 번째 open mode를 a에서 w로 바꿉니다.", prediction: "기존 두 줄이 truncate되고 '3. 파일' 한 줄만 남습니다.", result: "mode 선택이 write 내용보다 먼저 데이터 보존 정책을 결정합니다." },
            { change: "첫 open mode를 x로 바꾸고 같은 경로에 두 번 실행합니다.", prediction: "같은 TemporaryDirectory 실행 안에서 두 번째 x open은 FileExistsError입니다.", result: "존재 시 덮어쓰지 않는 생성 계약을 만들 수 있습니다." },
          ],
          sourceRefs: ["py-file-write-source", "py-file-read-source", "python-open-doc"],
        },
      ],
      diagnostics: [
        { symptom: "파일에 있던 내용이 새 실행 후 사라졌다.", likelyCause: "추가를 원했지만 w mode로 열어 open 시 기존 파일을 truncate했습니다.", checks: ["open mode와 실제 resolve 경로를 확인합니다.", "write 전에 backup·임시 파일이 남았는지 봅니다.", "프로세스 로그에서 파일 open 시점을 찾습니다."], fix: "목적이 단순 추가면 a, 존재 시 실패면 x, 전체 갱신이면 임시 파일에 완전히 쓴 뒤 replace를 사용합니다.", prevention: "중요 파일 w open을 code review에서 고위험 동작으로 다루고 복구 가능한 backup·atomic write 테스트를 둡니다." },
      ],
    },
    {
      id: "encoding-newline",
      title: "text 파일은 문자 encoding과 줄바꿈을 함께 계약해야 다른 환경에서 왕복됩니다",
      lead: "디스크에는 bytes가 저장되고 text mode의 encoder·decoder가 str과 bytes 사이를 변환합니다.",
      explanations: [
        "원본은 한글을 안정적으로 처리하기 위해 encoding='utf-8'을 명시합니다. encoding을 생략하면 플랫폼 기본값이 사용될 수 있어 Windows의 특정 legacy encoding과 Linux UTF-8 사이에서 결과가 달라질 수 있습니다. 프로젝트가 만든 text 파일은 가능한 한 UTF-8로 고정하고 외부 legacy 파일은 실제 encoding metadata를 근거로 decode합니다.",
        "잘못된 encoding으로 읽으면 UnicodeDecodeError가 나거나 더 위험하게 깨진 문자로 조용히 해석될 수 있습니다. errors='ignore'로 버리면 이름·금액·식별자 일부가 사라져 데이터가 변형됩니다. 오류 위치와 원본 파일을 격리하고 encoding을 확인한 뒤 명시적 변환 정책을 적용합니다.",
        "text mode는 universal newline 처리를 제공해 읽을 때 다양한 줄 끝을 '\n'으로 바꿀 수 있습니다. CSV처럼 newline 처리를 format library에 맡겨야 하는 경우 open(..., newline='')를 사용합니다. 일반 텍스트에서도 출력 format이 LF로 고정되어야 한다면 newline='\n' 정책과 대상 도구 호환성을 정합니다.",
        "write는 보통 버퍼에 먼저 기록됩니다. with 블록을 나가면 flush 후 close되지만 OS cache와 저장 장치까지 영구 기록됐다는 보장은 별도입니다. 금융·저널 같은 내구성 요구에는 flush, os.fsync, atomic replace와 디렉터리 sync까지 플랫폼별로 검토합니다.",
      ],
      concepts: [
        { term: "encoding", definition: "str의 Unicode 문자와 파일의 bytes 사이 변환 규칙입니다.", detail: ["읽기·쓰기 양쪽이 같은 규칙에 합의해야 합니다.", "UTF-8도 BOM 유무와 외부 도구 호환을 고려할 수 있습니다."] },
        { term: "newline translation", definition: "text mode가 플랫폼별 줄 끝 bytes와 Python의 '\n' 사이를 변환하는 동작입니다.", detail: ["CSV module은 보통 newline='' file 객체를 요구합니다.", "binary protocol에서는 변환 없이 bytes를 다룹니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "UnicodeDecodeError가 발생하거나 한글이 깨져 보인다.", likelyCause: "파일 bytes를 실제와 다른 encoding으로 decode했거나 쓰기와 읽기 encoding이 다릅니다.", checks: ["파일을 만든 시스템·도구의 encoding metadata를 확인합니다.", "작은 bytes prefix를 안전하게 검사하되 민감 내용을 로그에 남기지 않습니다.", "utf-8, utf-8-sig, 알려진 legacy encoding 후보를 통제된 복사본에서 검증합니다."], fix: "확인된 encoding을 명시해 decode하고 필요하면 별도 변환 단계로 UTF-8 표준 파일을 만듭니다. 무조건 errors='ignore'로 손실시키지 않습니다.", prevention: "입출력 spec에 encoding·BOM·newline을 기록하고 한글·emoji·빈 파일을 round-trip 테스트합니다." },
      ],
    },
    {
      id: "context-manager-lifetime",
      title: "with는 성공과 실패 모두에서 파일 자원 수명을 구조적으로 닫습니다",
      lead: "with open(...) as file 블록은 context manager의 __enter__와 __exit__ 사이에 파일 사용 범위를 눈에 보이게 만듭니다.",
      explanations: [
        "open이 만든 file 객체는 OS file descriptor 같은 제한 자원을 소유합니다. 직접 file.close를 마지막 줄에 두면 중간 return·break·예외에서 그 줄을 건너뛸 수 있습니다. with는 블록을 정상 종료하거나 예외로 나갈 때 __exit__를 실행해 close를 보장합니다.",
        "with가 예외를 자동 해결하는 것은 아닙니다. file context manager는 닫은 뒤 예외를 바깥으로 전파합니다. 따라서 어떤 예외를 복구할지 호출 경계에서 정하고 PermissionError·FileNotFoundError·UnicodeDecodeError를 한꺼번에 '파일 오류'로 숨기지 않습니다.",
        "with 블록 밖에서도 file 변수 이름은 남을 수 있지만 file.closed=True이고 읽기·쓰기는 ValueError가 납니다. 자원 객체를 반환해 블록 밖에서 사용하게 만들지 말고 필요한 data를 블록 안에서 읽어 일반 객체로 반환하거나 caller가 context manager 수명을 소유하게 합니다.",
        "여러 파일을 동시에 열 수 있지만 두 번째 open이 실패하면 이미 성공한 첫 context는 정리되어야 합니다. 한 with 문에 여러 manager를 나열하거나 contextlib.ExitStack을 사용하면 동적 개수 자원도 역순으로 정리합니다.",
      ],
      concepts: [
        { term: "context manager", definition: "with 진입과 종료 시점에 획득·정리 동작을 제공하는 __enter__·__exit__ protocol 객체입니다.", detail: ["파일 외에도 lock·DB transaction·temporary directory에 쓰입니다.", "예외 발생 여부가 __exit__에 전달됩니다."] },
        { term: "resource lifetime", definition: "파일 descriptor·socket·lock 같은 자원을 획득한 시점부터 반드시 반환하는 시점까지의 범위입니다.", detail: ["가능한 한 짧고 구조적으로 명확해야 합니다.", "객체 이름 수명과 OS 자원 수명은 같지 않을 수 있습니다."] },
      ],
      codeExamples: [
        {
          id: "context-manager-exception-cleanup",
          title: "예외로 블록을 나가도 파일이 닫히는지 확인",
          language: "python",
          filename: "context_cleanup.py",
          purpose: "예외 발생 전·후 file.closed와 이미 기록된 내용을 확인해 context manager의 정리 순서를 재현합니다.",
          code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\n\nwith TemporaryDirectory() as temp_dir:\n    path = Path(temp_dir) / 'checkpoint.txt'\n    try:\n        with path.open('w', encoding='utf-8') as file:\n            file.write('저장됨\\n')\n            print(f'inside closed={file.closed}')\n            raise RuntimeError('처리 중단')\n    except RuntimeError as error:\n        print(f'caught={error}')\n\n    print(f'outside closed={file.closed}')\n    print(f'content={path.read_text(encoding=\"utf-8\").strip()}')",
          walkthrough: [
            { lines: "1-5", explanation: "격리 임시 경로를 만들고 아직 파일을 열지 않습니다." },
            { lines: "6-10", explanation: "with 안에서 한 줄을 버퍼에 쓰고 file이 열린 상태를 확인한 뒤 의도적으로 RuntimeError를 발생시킵니다." },
            { lines: "11-13", explanation: "except로 오기 전에 file.__exit__가 flush와 close를 수행하고 예외는 그대로 전파됩니다." },
            { lines: "15-16", explanation: "블록 밖 file 객체가 닫혔고 flush된 한 줄을 새 read_text 호출로 읽을 수 있음을 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "context_cleanup.py로 저장"], command: "python context_cleanup.py" },
          output: { value: "inside closed=False\ncaught=처리 중단\noutside closed=True\ncontent=저장됨", explanation: ["예외가 발생한 순간에는 블록 안이라 file이 열려 있습니다.", "except가 실행될 때는 __exit__ 정리가 끝나 file.closed가 True입니다.", "with는 close를 보장하지만 부분 결과를 자동 rollback하지 않아 이미 쓴 한 줄은 남습니다."] },
          experiments: [
            { change: "with를 직접 open과 마지막 close로 바꾸고 raise 뒤에 close를 둡니다.", prediction: "raise 때문에 close 줄을 건너뛰고 except 뒤 file.closed는 False일 수 있습니다.", result: "정리 코드를 일반 흐름 마지막 줄에 두는 방식의 누수 위험을 확인합니다." },
            { change: "raise 전에 두 번째 줄 일부를 쓰고 예외를 냅니다.", prediction: "close 때 버퍼가 flush되어 부분 업무 결과도 파일에 남을 수 있습니다.", result: "자원 정리와 업무 transaction rollback은 별도 문제이므로 atomic write가 필요합니다." },
          ],
          sourceRefs: ["py-file-write-source", "py-file-read-source", "python-context-doc"],
        },
      ],
      diagnostics: [
        { symptom: "ValueError: I/O operation on closed file이 발생한다.", likelyCause: "with 블록 밖에서 닫힌 file 객체를 읽거나 쓰거나 iterator를 지연 소비합니다.", checks: ["실패 줄이 with 들여쓰기 안인지 확인합니다.", "함수가 file iterator·generator를 반환하는지 봅니다.", "file.closed 값을 확인합니다."], fix: "필요한 data를 with 안에서 materialize하거나 caller가 with를 소유하도록 context manager를 반환하는 명시적 API로 바꿉니다.", prevention: "file 객체 수명을 블록 안으로 제한하고 닫힌 뒤 사용 테스트를 추가합니다." },
      ],
    },
    {
      id: "reading-strategies",
      title: "파일 크기와 처리 목적에 따라 전체 읽기·줄 iteration·chunk 읽기를 선택합니다",
      lead: "read는 간단하지만 파일 전체를 메모리에 올리므로 입력 크기가 신뢰되지 않으면 자원 고갈 경계가 됩니다.",
      explanations: [
        "원본 ex03은 f.read()로 sample01 전체를 하나의 str로 읽습니다. 10줄 예제에는 적절하지만 수 GB 로그나 사용자 업로드에 그대로 적용하면 메모리가 부족할 수 있습니다. 한 줄 record 형식은 for line in file iteration으로 현재 줄만 처리합니다.",
        "readline은 한 줄을 반환하고 EOF에서 빈 문자열을 반환합니다. 공백만 있는 줄 '\n'과 EOF ''를 구분해야 합니다. readlines는 모든 줄을 list로 만들어 역시 전체 크기만큼 메모리를 사용합니다. 이름이 비슷해도 자원 특성이 다릅니다.",
        "binary 대용량 파일은 file.read(chunk_size) 반복으로 제한된 byte chunk를 처리합니다. text mode chunk는 Unicode 문자 경계를 decoder가 관리하지만 line record가 chunk 경계에서 나뉠 수 있습니다. format parser가 제공하는 streaming API를 우선합니다.",
        "외부 파일은 최대 byte 크기·최대 line 길이·최대 record 수·처리 시간을 제한합니다. 한 줄이 수백 MB면 줄 iteration도 한 번에 큰 str을 만들 수 있습니다. 입력 크기 제한은 성능 최적화가 아니라 서비스 가용성 보안입니다.",
      ],
      concepts: [
        { term: "streaming", definition: "전체 data를 한 번에 materialize하지 않고 작은 단위로 순차 처리하는 방식입니다.", detail: ["메모리 사용을 제한합니다.", "중간 실패·부분 결과·재시도 정책이 필요합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "작은 파일은 되지만 큰 파일에서 프로세스 메모리가 급증하거나 종료된다.", likelyCause: "read 또는 readlines로 전체 파일을 materialize하거나 처리 결과도 모두 list에 누적합니다.", checks: ["파일 byte 크기와 peak memory를 측정합니다.", "read·readlines·list(file) 사용을 찾습니다.", "한 줄 최대 길이와 결과 누적 구조를 확인합니다."], fix: "line 또는 chunk streaming으로 처리하고 최대 크기·record 수를 제한하며 결과도 incremental sink로 보냅니다.", prevention: "작은 fixture뿐 아니라 제한 근처와 초과 크기 합성 파일로 자원 테스트를 수행합니다." },
      ],
    },
    {
      id: "safe-write-operations",
      title: "중요 파일 갱신은 임시 파일 완성 후 원자적으로 교체하고 동시 쓰기 정책을 둡니다",
      lead: "with가 close를 보장해도 중간 예외로 원본이 절반만 갱신되는 업무 손상까지 rollback해 주지는 않습니다.",
      explanations: [
        "전체 설정·JSON·CSV를 갱신할 때 대상 자체를 w로 열면 즉시 원본이 사라집니다. 같은 디렉터리에 임시 파일을 만들고 전체 내용을 쓰고 flush·필요시 fsync한 뒤 os.replace로 교체하면 독자는 보통 이전 완성본 또는 새 완성본 중 하나를 보게 됩니다. 교체의 원자성·권한·metadata 동작은 대상 파일 시스템을 확인합니다.",
        "두 프로세스가 동시에 read-modify-write하면 마지막 writer가 앞 변경을 잃게 할 수 있습니다. 단순 append도 record 조각이 섞일 수 있습니다. file lock, 단일 writer queue, version check, DB transaction 중 데이터 중요도와 환경에 맞는 조정을 사용합니다.",
        "임시 파일 이름을 예측 가능하게 직접 만들면 symlink·충돌 위험이 있습니다. tempfile.NamedTemporaryFile 또는 mkstemp를 사용하고 권한을 제한합니다. 실패한 임시 파일의 정리와 복구 검사도 운영 절차에 포함합니다.",
        "백업 파일도 민감 data를 복제합니다. 최소 권한·암호화·보존 기간·삭제 정책을 적용하고 오류 로그에 전체 내용이나 절대 경로를 남기지 않습니다. 안전한 쓰기는 데이터 무결성뿐 아니라 기밀성과 복구 가능성을 함께 다룹니다.",
      ],
      concepts: [
        { term: "atomic replace", definition: "완성된 임시 파일을 대상 이름으로 한 번에 교체해 중간 부분 파일 노출을 줄이는 갱신 패턴입니다.", detail: ["같은 파일 시스템·디렉터리에서의 동작을 확인합니다.", "writer 충돌 해결과 durability는 별도 정책이 필요합니다."] },
        { term: "lost update", definition: "여러 writer가 같은 이전 상태를 읽고 각각 쓴 결과 중 나중 쓰기가 앞 변경을 덮어 없애는 동시성 문제입니다.", detail: ["with나 atomic rename만으로 자동 해결되지 않습니다.", "lock·version·transaction으로 조정합니다."] },
      ],
      codeExamples: [],
      diagnostics: [
        { symptom: "프로세스 중단 뒤 파일이 비어 있거나 JSON이 중간에서 잘려 파싱되지 않는다.", likelyCause: "대상 파일을 w로 직접 열어 갱신 도중 실패했고 업무 수준의 원자적 교체가 없습니다.", checks: ["임시·backup 파일과 수정 시간을 확인합니다.", "write·flush·close·replace 단계 로그를 구분합니다.", "동시 writer와 disk full·권한 오류를 재현합니다."], fix: "같은 디렉터리 임시 파일에 완전한 내용을 쓰고 검증·flush한 뒤 os.replace하며 실패 시 원본을 보존합니다.", prevention: "각 단계 fault injection, 동시 writer, disk full에 가까운 환경, recovery test를 둡니다." },
      ],
      comparisons: [
        { title: "파일 전체를 어떻게 갱신할까요?", options: [
          { name: "대상 w 직접 쓰기", chooseWhen: "손실돼도 다시 만들 수 있는 작은 임시 산출물일 때", avoidWhen: "사용자 설정·유일 원본처럼 중간 실패 시 복구가 어려울 때", tradeoffs: ["구현이 단순합니다.", "open 즉시 기존 내용을 잃습니다.", "부분 파일이 노출될 수 있습니다."] },
          { name: "임시 파일 후 replace", chooseWhen: "독자에게 완성본만 보여야 하는 전체 파일 갱신일 때", avoidWhen: "여러 writer merge나 transaction이 핵심인데 조정 없이 rename만 사용할 때", tradeoffs: ["중간 손상을 크게 줄입니다.", "임시 정리·권한·동일 파일 시스템 조건을 다뤄야 합니다.", "동시 갱신 충돌은 별도로 해결합니다."] },
          { name: "DB·전용 저장소", chooseWhen: "동시 writer·query·transaction·복구가 중요한 상태일 때", avoidWhen: "배포 가능한 작은 정적 resource 한 개면 충분할 때", tradeoffs: ["동시성과 transaction 기능을 제공합니다.", "운영 복잡도와 schema 관리가 늘어납니다.", "backup·migration 정책이 필요합니다."] },
        ] },
      ],
      expertNotes: ["POSIX와 Windows의 rename·열린 파일·fsync semantics는 다를 수 있으므로 중요 data는 실제 배포 파일 시스템에서 crash-consistency를 검증합니다.", "TOCTOU를 줄이려면 exists 확인 후 open보다 x mode, directory file descriptor 기반 API, 최소 권한처럼 검사와 사용을 가까이 둡니다."],
    },
  ],
  lab: {
    title: "실행 위치 독립적인 학습 일지 저장소",
    scenario: "날짜별 학습 기록을 UTF-8 JSON Lines로 저장하고 다시 streaming 조회하는 작은 repository를 만들되 경로 탈출·중간 실패·동시 실행 정책을 명시합니다.",
    setup: ["study_log.py와 test_study_log.py를 만듭니다.", "테스트는 TemporaryDirectory를 기준 디렉터리로 사용합니다.", "각 record는 id·topic·minutes를 가진 합성 data만 사용합니다."],
    steps: ["StudyLog가 base_dir Path를 생성자 인수로 받고 cwd나 전역 경로를 직접 읽지 않게 합니다.", "파일 이름은 허용된 날짜 형식으로 생성하고 resolve 후 base 내부인지 검증합니다.", "append_record는 encoding='utf-8', newline=''와 with를 사용하고 한 write에 JSON 한 줄을 기록합니다.", "iter_records는 파일 객체를 with 안에서 iteration하되 generator 수명 문제를 명시적으로 해결합니다.", "최대 파일 크기·line 길이·record 수를 검사합니다.", "잘못된 UTF-8·깨진 JSON line을 skip할지 중단할지 정책과 오류 위치를 정의합니다.", "compact는 대상 w 직접 쓰기 대신 임시 파일에 완성본을 쓰고 검증한 뒤 replace합니다.", "정상·빈 파일·없는 파일·../ 입력·예외 cleanup·부분 임시 파일·동시 writer 시나리오를 테스트합니다."],
    expectedResult: ["프로젝트를 어느 cwd에서 실행해도 주입한 base_dir 아래 같은 파일을 사용합니다.", "한글 topic이 UTF-8로 정확히 왕복됩니다.", "with 블록 종료와 오류 뒤 열린 file descriptor가 남지 않습니다.", "path traversal 입력이 기준 밖 파일에 접근하지 못합니다.", "compact 중 오류가 나도 기존 완성 파일이 보존됩니다.", "대용량 입력은 전체 read 없이 제한된 메모리로 처리됩니다."],
    cleanup: ["TemporaryDirectory가 테스트 파일을 자동 정리합니다.", "실패 시 남긴 임시 파일은 recovery test에서 확인 후 삭제합니다."],
    extensions: ["file lock 또는 version compare로 lost update를 방지합니다.", "gzip text stream adapter를 같은 repository 계약에 추가합니다.", "async file I/O가 실제 병목에 이득인지 측정합니다.", "민감 topic 암호화와 key rotation·backup 보존 정책을 설계합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "원본 ex02·ex03을 격리 임시 디렉터리에서 w→r→a 순서로 재현하세요.", requirements: ["cwd와 resolve 경로를 구분해 기록합니다.", "w 후 10행, a 후 20행을 검증합니다.", "UTF-8 한글과 file.closed를 확인합니다.", "a를 w로 잘못 바꿨을 때 손실 결과를 별도 복사본에서 재현합니다."], hints: ["실제 원본 data 폴더 대신 TemporaryDirectory를 사용합니다.", "splitlines로 행 수를 검사할 수 있습니다."], expectedOutcome: "경로 기준·모드·인코딩·close가 파일 결과에 미치는 영향을 실행 증거로 설명합니다.", solutionOutline: ["Path 기준 디렉터리를 만듭니다.", "각 mode 블록 뒤 내용을 다시 읽어 단언합니다.", "실패 실험은 별도 파일에 실행합니다."] },
    { difficulty: "응용", prompt: "대용량 로그에서 ERROR 행만 새 파일로 streaming 추출하세요.", requirements: ["원본 전체를 read 또는 readlines로 올리지 않습니다.", "최대 input byte·line 길이·출력 record 수를 제한합니다.", "입출력 encoding과 decode 오류 정책을 명시합니다.", "출력은 임시 파일 후 replace로 완성본만 노출합니다.", "빈 파일·거대 한 줄·중간 예외·disk write 실패 테스트를 작성합니다."], hints: ["for line in file로 한 줄씩 처리합니다.", "출력 대상 직접 w open의 위험을 먼저 설명합니다."], expectedOutcome: "자원 제한과 실패 복구를 갖춘 streaming 변환 pipeline을 만듭니다." },
    { difficulty: "설계", prompt: "사용자 업로드를 저장하는 multi-tenant 파일 서비스 경계를 설계하세요.", requirements: ["tenant별 기준 디렉터리와 path traversal·symlink 방어를 포함합니다.", "파일 이름·확장자·MIME·최대 크기·quota를 검증합니다.", "동시 업로드·중복 이름·원자적 publish 정책을 정합니다.", "악성 압축·실행 파일·바이러스 검사 격리 흐름을 포함합니다.", "권한·암호화·backup·retention·감사 로그를 설계합니다.", "절대 경로와 원문 내용이 로그에 노출되지 않게 합니다."], hints: ["Path.resolve 하나만으로 모든 symlink race가 해결된다고 가정하지 않습니다.", "임시 격리와 최종 publish를 분리합니다."], expectedOutcome: "파일 문법에서 데이터 무결성·가용성·기밀성·동시성까지 확장한 저장 경계를 제안합니다." },
  ],
  reviewQuestions: [
    { question: "상대 경로는 기본적으로 무엇을 기준으로 해석되나요?", answer: "Python 프로세스의 current working directory를 기준으로 해석되며 소스 파일 디렉터리와 같다는 보장은 없습니다." },
    { question: "w와 a의 가장 중요한 차이는 무엇인가요?", answer: "w는 기존 파일을 open 시 truncate하고 새로 쓰며 a는 기존 내용을 보존하고 파일 끝에 추가합니다." },
    { question: "x mode는 언제 유용한가요?", answer: "대상 파일이 이미 있으면 덮어쓰지 않고 FileExistsError로 실패해야 하는 exclusive creation에 유용합니다." },
    { question: "encoding을 생략하면 왜 환경 차이가 생길 수 있나요?", answer: "플랫폼 기본 encoding을 사용할 수 있어 같은 bytes를 다른 문자로 해석하거나 UnicodeDecodeError가 날 수 있습니다." },
    { question: "with가 예외를 자동 복구하나요?", answer: "아닙니다. 파일을 닫는 정리는 보장하지만 보통 예외는 바깥으로 전파되고 이미 쓴 부분을 업무적으로 rollback하지도 않습니다." },
    { question: "read와 file iteration은 메모리에서 어떻게 다른가요?", answer: "read는 전체 내용을 한 str 또는 bytes로 만들고 iteration은 보통 한 줄씩 처리해 큰 파일의 peak memory를 줄입니다." },
    { question: "Path.exists 확인 후 open하면 동시성상 안전한가요?", answer: "확인 직후 상태가 바뀔 수 있어 완전히 안전하지 않습니다. 실제 open 예외를 처리하고 필요하면 x mode·lock·원자 API를 사용합니다." },
    { question: "중요 파일을 전체 갱신할 때 대상에 직접 w 쓰기보다 나은 패턴은 무엇인가요?", answer: "같은 디렉터리 임시 파일에 완성본을 쓰고 검증·flush한 뒤 os.replace로 원자적 교체하는 패턴입니다." },
  ],
  completionChecklist: [
    "cwd·소스 위치·설정 data 기준을 구분해 경로를 구성할 수 있다.",
    "Path로 하위 경로를 만들고 기준 디렉터리 포함 여부를 검증할 수 있다.",
    "r·w·a·x·b·t·+의 존재·절단·추가 계약을 설명할 수 있다.",
    "UTF-8 encoding과 newline 정책을 명시하고 decode 오류를 진단할 수 있다.",
    "with 정상·예외 경로의 close 순서를 실행 결과로 설명할 수 있다.",
    "파일 크기에 맞춰 read·line iteration·chunk streaming을 선택할 수 있다.",
    "임시 파일 후 replace와 동시 writer 제어가 해결하는 문제를 구분할 수 있다.",
    "path traversal·symlink·민감 로그·최소 권한을 파일 경계에 적용할 수 있다.",
  ],
  nextSessions: [],
  sources: [
    { id: "py-file-write-source", repository: "PYTHON-BASIC", path: "day05/ex02_file.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex02_file.py", usedFor: ["os.getcwd", "os.path.join", "w mode", "UTF-8", "with와 write"], evidence: "원본에서 cwd와 ../data/sample01.txt 경로를 출력하고 with open(...,'w',encoding='utf-8')로 1~10번째 줄을 기록하는 흐름을 감사했습니다." },
    { id: "py-file-read-source", repository: "PYTHON-BASIC", path: "day05/ex03_file.py", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/day05/ex03_file.py", usedFor: ["r mode", "read", "a mode", "반복 append"], evidence: "원본의 sample01 전체 read와 sample02 append 흐름을 감사했고 기존 실행 흔적에서 10행 단위 누적 동작을 확인했습니다." },
    { id: "py-day05-file-note", repository: "PYTHON-BASIC", path: "notes/day05_lambda_file_excel.md", publicUrl: "https://github.com/notetester/PYTHON-BASIC/blob/main/notes/day05_lambda_file_excel.md", usedFor: ["경로 결합", "r·w·a 표", "with 자동 close", "CSV newline 연결"], evidence: "Day05 노트의 파일 범위를 session 중심으로 재구성하고 CSV·Excel·JSON은 py-025~027로 분리했습니다." },
    { id: "python-open-doc", repository: "Python documentation", path: "library/functions.html#open", publicUrl: "https://docs.python.org/3/library/functions.html#open", usedFor: ["파일 모드", "encoding", "newline", "buffering", "text·binary"], evidence: "공식 built-in open 계약을 기준으로 모드 조합과 text 변환·오류 진단을 보강했습니다." },
    { id: "python-context-doc", repository: "Python documentation", path: "reference/datamodel.html#context-managers", publicUrl: "https://docs.python.org/3/reference/datamodel.html#context-managers", usedFor: ["__enter__", "__exit__", "예외 cleanup"], evidence: "공식 context manager protocol을 기준으로 with의 자원 정리와 업무 rollback의 차이를 설명했습니다." },
  ],
  sourceCoverage: { filesRead: 3, filesUsed: 3, uncoveredNotes: ["CSV·Excel·JSON은 각각 py-025·py-026·py-027에서 형식별 schema와 실행 결과를 확장합니다.", "pathlib·atomic replace·동시 writer·path traversal·resource limit은 원본 경로/파일 예제를 전문가 운영 경계로 보강한 내용입니다."] },
} satisfies DetailedSession;

export default session;
