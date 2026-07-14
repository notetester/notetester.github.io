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
          run: { environment: ["Python 3.8 이상", "file_modes.py로 저장"], command: "python -I -X utf8 file_modes.py" },
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
            { lines: "14-15", explanation: "블록 밖 file 객체가 닫혔고 flush된 한 줄을 새 read_text 호출로 읽을 수 있음을 확인합니다." },
          ],
          run: { environment: ["Python 3.8 이상", "context_cleanup.py로 저장"], command: "python -I -X utf8 context_cleanup.py" },
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

const expertSession = session as DetailedSession;
expertSession.level = "전문가";
expertSession.estimatedMinutes = 380;
expertSession.chapters.push(
  {
    id: "text-io-encoding-newline-buffering-lifetime",
    title: "텍스트 파일을 bytes↔str 변환·newline·buffer·자원 수명 계약으로 다룹니다",
    lead: "파일을 연다는 것은 path만 맞추는 일이 아닙니다. mode가 허용하는 연산, bytes를 str로 바꾸는 encoding과 errors, newline 변환, buffering, close 시점을 모두 명시해야 플랫폼과 데이터가 바뀌어도 결과를 재현할 수 있습니다.",
    explanations: [
      "text mode는 storage의 bytes와 Python str 사이에 encoding/decoding을 수행합니다. encoding을 생략하면 locale 기본값에 의존해 같은 파일이 컴퓨터마다 다르게 읽히거나 UnicodeDecodeError가 날 수 있습니다. 애플리케이션 포맷은 `encoding='utf-8'`처럼 명시하고 BOM이 있는 외부 CSV 등은 실제 포맷 계약에 맞춰 utf-8-sig 등을 선택합니다.",
      "errors='ignore'는 읽을 수 없는 bytes를 조용히 버려 데이터 손실을 만들 수 있습니다. strict를 기본으로 실패 위치를 보고하고, 대체가 제품 요구라면 replace·surrogateescape 같은 정책과 round-trip 가능성을 문서화합니다. 비밀 데이터의 raw bytes를 예외 로그에 그대로 남기지 않습니다.",
      "newline=None 읽기는 `\r`, `\n`, `\r\n`을 universal newline로 인식해 반환 str에서 `\n`으로 변환합니다. newline=''은 여러 줄 끝을 인식하되 원래 terminator를 보존합니다. 쓰기에서 newline='\n'을 명시하면 포맷의 line ending을 고정할 수 있습니다. csv 모듈은 자체 newline 처리를 위해 문서가 권장하는 `newline=''`을 따릅니다.",
      "mode `r`는 존재 파일 읽기, `w`는 열자마자 truncate, `a`는 끝에 추가, `x`는 이미 존재하면 FileExistsError인 exclusive create입니다. `+`는 읽기/쓰기를 모두 허용하지만 file position을 명시적으로 seek해야 합니다. binary mode에서는 encoding/newline 인수가 허용되지 않습니다.",
      "Python file object는 buffering을 사용하므로 write가 OS에 전달됐다는 사실과 저장 장치에 durability가 확보됐다는 사실은 다릅니다. close는 Python buffer를 flush하지만 crash-consistent 저장이 필요하면 flush·os.fsync·atomic replace와 filesystem 특성을 별도로 설계합니다.",
      "with 문은 __enter__ 결과를 binding하고 정상·예외·return 경로에서 __exit__를 호출합니다. 파일을 with 바깥으로 반환하면 이미 닫힌 handle이 되므로 필요한 데이터나 caller가 책임질 context manager를 반환합니다. iterator로 line을 지연 반환할 때도 파일 수명이 소비 기간 전체를 감싸야 합니다.",
    ],
    concepts: [
      { term: "text I/O layer", definition: "bytes stream 위에서 encoding·errors·newline 변환을 적용해 str을 읽고 쓰는 계층입니다.", detail: ["encoding을 포맷 계약으로 명시합니다.", "binary mode와 parameter가 다릅니다."] },
      { term: "universal newlines", definition: "읽을 때 여러 운영체제 line ending을 인식하고 선택한 정책에 따라 `\n`으로 변환하는 기능입니다.", detail: ["newline=None은 변환합니다.", "newline=''은 terminator를 반환값에 보존합니다."] },
      { term: "resource lifetime", definition: "파일 descriptor가 열린 시점부터 flush·close되고 더 이상 사용할 수 없는 시점까지의 소유권 범위입니다.", detail: ["with block이 가장 명확한 경계입니다.", "lazy iterator는 소비 기간과 file lifetime을 맞춰야 합니다."] },
    ],
    codeExamples: [
      {
        id: "utf8-newline-roundtrip",
        title: "UTF-8과 LF를 고정한 cross-platform round trip",
        language: "python",
        filename: "text_io_contract.py",
        purpose: "임시 디렉터리 안에서 text mode의 명시 encoding/newline과 실제 bytes, context manager close 상태를 검증합니다.",
        code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\n\nwith TemporaryDirectory() as directory:\n    path = Path(directory) / 'lesson.txt'\n    with path.open('w', encoding='utf-8', newline='\\n') as file:\n        file.write('파이썬\\n파일\\n')\n    print(path.read_bytes() == '파이썬\\n파일\\n'.encode('utf-8'))\n\n    with path.open('r', encoding='utf-8', newline=None) as file:\n        text = file.read()\n        print(repr(text))\n    print(f'closed={file.closed}')",
        walkthrough: [
          { lines: "1-5", explanation: "운영체제가 정리하는 임시 directory 아래 pathlib Path를 만들어 실제 사용자 경로와 격리합니다." },
          { lines: "6-8", explanation: "UTF-8과 LF newline을 명시해 쓰고 raw bytes가 포맷 계약과 같은지 확인합니다." },
          { lines: "10-13", explanation: "universal newline 읽기로 str을 얻고 with를 나온 뒤 handle이 닫혔음을 확인합니다." },
        ],
        run: { environment: ["Python 3.8 이상", "text_io_contract.py를 UTF-8로 저장"], command: "python -I -X utf8 text_io_contract.py" },
        output: { value: "True\n'파이썬\\n파일\\n'\nclosed=True", explanation: ["파일 bytes는 UTF-8로 인코딩된 LF 문자열과 정확히 같습니다.", "read 결과의 line ending은 `\n`입니다.", "정상 경로에서도 context manager가 파일을 닫았습니다."] },
        experiments: [
          { change: "읽기 encoding을 ascii로 바꿉니다.", prediction: "한글 bytes를 decode할 수 없어 UnicodeDecodeError입니다.", result: "encoding은 표시 옵션이 아니라 bytes↔str 계약임을 확인합니다." },
          { change: "with 안에서 의도적으로 RuntimeError를 raise하고 finally에서 file.closed를 봅니다.", prediction: "예외가 전파돼도 __exit__가 실행되어 파일은 닫힙니다.", result: "context manager의 예외 cleanup을 확인합니다." },
        ],
        sourceRefs: ["python-open-doc", "python-context-doc", "python-pathlib-doc-024", "python-io-doc-024", "python-tempfile-doc-024"],
      },
    ],
    diagnostics: [
      { symptom: "같은 텍스트 파일이 한 PC에서는 읽히고 다른 PC에서는 UnicodeDecodeError가 난다.", likelyCause: "encoding을 생략해 서로 다른 locale 기본 encoding을 사용했습니다.", checks: ["파일 포맷의 실제 encoding/BOM을 확인합니다.", "open 호출의 encoding·errors를 검색합니다.", "raw bytes의 작은 fixture를 격리 환경에서 읽습니다."], fix: "생산 포맷에 맞는 명시 encoding을 사용하고 잘못된 bytes 정책을 strict 중심으로 정합니다.", prevention: "UTF-8·비 ASCII·잘못된 byte fixture를 CI에서 round-trip 테스트합니다." },
      { symptom: "Windows와 Linux에서 snapshot diff에 모든 줄이 변경된 것처럼 보인다.", likelyCause: "newline 변환이나 도구 기본 line ending이 파일 포맷과 일치하지 않습니다.", checks: ["read_bytes로 `\r\n`과 `\n`을 확인합니다.", "open newline 인수와 VCS 설정을 봅니다.", "csv 모듈이면 newline='' 권고를 확인합니다."], fix: "파일 형식의 newline을 명시하고 reader/writer를 같은 계약으로 맞춥니다.", prevention: "bytes 수준 golden fixture와 .gitattributes line-ending 정책을 둡니다." },
    ],
    expertNotes: ["텍스트 파일의 tell 값은 단순 문자 index가 아닌 opaque cookie일 수 있으므로 임의 arithmetic 대신 받은 위치를 seek에 되돌려 사용합니다.", "file object finalizer에 close를 맡기면 구현·GC 시점에 의존하므로 descriptor가 많은 서비스에서는 반드시 명시 수명을 사용합니다."],
  },
  {
    id: "atomic-write-replace-flush-fsync-durability",
    title: "원본 보존을 위해 같은 디렉터리 임시 파일→flush→fsync→atomic replace 순서를 설계합니다",
    lead: "`open(path, 'w')`는 성공적인 새 내용이 준비되기 전에 기존 파일을 truncate합니다. 중간 crash·예외에서도 이전 또는 완성된 새 파일만 보이게 하려면 임시 파일에 완전히 쓴 뒤 원자적 이름 교체를 사용합니다.",
    explanations: [
      "안전한 replace 패턴은 target과 같은 filesystem·directory에 예측 불가능하게 생성한 temp file을 열고, 전체 내용을 기록·검증한 뒤 flush와 os.fsync로 file data를 요청하고, handle을 닫은 다음 `os.replace(temp, target)`를 호출합니다. 같은 filesystem 안 replace는 일반적으로 관찰자에게 이름 교체를 atomic하게 제공하지만 filesystem·네트워크 mount별 보장은 확인해야 합니다.",
      "tempfile.mkstemp 또는 NamedTemporaryFile은 이름 선택과 생성 사이 race를 피하도록 파일을 즉시 안전하게 생성합니다. deprecated mktemp처럼 이름만 먼저 얻고 나중 open하면 공격자나 다른 process가 그 사이 같은 이름을 만들 수 있습니다. descriptor 소유권과 Windows에서 열린 파일 rename 제약 때문에 close 순서를 테스트합니다.",
      "`file.flush()`는 Python user-space buffer를 OS로 밀고 `os.fsync(file.fileno())`는 OS에 file descriptor data를 저장 장치로 동기화하도록 요청합니다. replace 뒤 directory entry durability까지 필요하면 POSIX에서 directory descriptor fsync를 고려하지만 Windows와 일부 filesystem에서 방법·보장이 다릅니다. atomic visibility와 power-loss durability는 별도 속성입니다.",
      "replace 실패 전에는 target을 그대로 두고 temp를 cleanup해야 합니다. replace 성공 뒤 temp path는 더 이상 존재하지 않으므로 finally의 missing-ok 삭제가 안전합니다. cleanup 오류가 원래 write 오류를 가리지 않게 예외 정책을 세우고 temp filename에 비밀을 넣지 않습니다.",
      "여러 writer의 lost update는 atomic replace만으로 해결되지 않습니다. 둘 다 같은 이전 버전을 읽어 각자 완성 파일을 replace하면 마지막 writer가 이깁니다. file lock, compare-and-swap version, database transaction, single writer queue 같은 동시성 제어가 별도로 필요합니다.",
      "append는 각 write 호출의 원자성·record 경계를 플랫폼마다 다르게 보장할 수 있고 여러 process line이 섞일 수 있습니다. 감사 로그처럼 강한 순서와 durability가 필요하면 전용 logging handler·database·append-only service를 선택합니다.",
    ],
    concepts: [
      { term: "atomic replace", definition: "독자가 target 이름에서 부분 작성 파일을 관찰하지 않도록 완성된 임시 파일을 한 번의 이름 교체 연산으로 대체하는 패턴입니다.", detail: ["temp와 target을 같은 filesystem에 둡니다.", "동시 writer lost update는 별도 문제입니다."] },
      { term: "flush versus fsync", definition: "flush는 Python buffer를 OS에 전달하고 fsync는 file descriptor의 data를 저장 장치에 동기화하도록 OS에 요청하는 서로 다른 단계입니다.", detail: ["둘 다 atomicity와 같지 않습니다.", "directory metadata durability도 별도일 수 있습니다."] },
      { term: "crash consistency", definition: "process·OS·전원 실패 중에도 저장 상태가 사전에 정의한 유효 상태 집합 안에 남도록 하는 속성입니다.", detail: ["이전 파일 또는 완성된 새 파일을 목표로 합니다.", "filesystem 보장과 fault injection으로 검증합니다."] },
    ],
    codeExamples: [
      {
        id: "atomic-tempfile-os-replace",
        title: "mkstemp·fsync·os.replace로 완성 파일만 교체",
        language: "python",
        filename: "atomic_write.py",
        purpose: "사용자 파일을 건드리지 않는 임시 디렉터리에서 두 번의 atomic write와 temp cleanup을 검증합니다.",
        code: "import os\nfrom pathlib import Path\nfrom tempfile import TemporaryDirectory, mkstemp\n\ndef atomic_write_text(target, text):\n    descriptor, temp_name = mkstemp(prefix=f'.{target.name}.', suffix='.tmp', dir=target.parent)\n    temp_path = Path(temp_name)\n    try:\n        with os.fdopen(descriptor, 'w', encoding='utf-8', newline='\\n') as file:\n            file.write(text)\n            file.flush()\n            os.fsync(file.fileno())\n        os.replace(temp_path, target)\n    finally:\n        temp_path.unlink(missing_ok=True)\n\nwith TemporaryDirectory() as directory:\n    root = Path(directory)\n    target = root / 'state.txt'\n    atomic_write_text(target, 'version=1\\n')\n    atomic_write_text(target, 'version=2\\n')\n    print(target.read_text(encoding='utf-8'), end='')\n    print(f'temps={sorted(path.name for path in root.glob(\"*.tmp\"))}')",
        walkthrough: [
          { lines: "1-7", explanation: "target과 같은 directory에 mkstemp로 즉시 생성된 임시 파일 descriptor와 path를 얻습니다." },
          { lines: "8-14", explanation: "descriptor를 text file object로 소유하고 write→flush→fsync→close 뒤 os.replace하며 모든 실패 경로에서 남은 temp를 지웁니다." },
          { lines: "16-22", explanation: "격리 임시 directory에서 version 1을 version 2로 교체하고 최종 내용과 temp 잔존 0개를 확인합니다." },
        ],
        run: { environment: ["Python 3.8 이상", "atomic_write.py를 UTF-8로 저장"], command: "python -I -X utf8 atomic_write.py" },
        output: { value: "version=2\ntemps=[]", explanation: ["target에는 두 번째 완성 내용만 보입니다.", "replace 뒤 temp 이름은 사라지고 finally cleanup 후 잔존 파일도 없습니다.", "예제는 file fsync까지 수행하며 directory fsync의 플랫폼별 정책은 별도입니다."] },
        experiments: [
          { change: "os.replace 직전에 예외를 발생시킵니다.", prediction: "기존 target은 그대로이고 finally가 새 temp를 삭제합니다.", result: "부분 새 내용으로 원본을 덮지 않는 실패 격리를 확인합니다." },
          { change: "tempfile을 다른 filesystem directory에 만듭니다.", prediction: "os.replace가 실패하거나 atomic rename 보장이 성립하지 않을 수 있습니다.", result: "같은 target directory에 temp를 두는 이유를 확인합니다." },
        ],
        sourceRefs: ["python-tempfile-doc-024", "python-os-replace-doc-024", "python-os-fsync-doc-024", "python-pathlib-doc-024"],
      },
    ],
    diagnostics: [
      { symptom: "쓰기 중 예외 뒤 원본 파일이 0 byte 또는 절반 내용이 됐다.", likelyCause: "target을 w mode로 직접 truncate한 뒤 전체 쓰기 성공 전에 실패했습니다.", checks: ["write path가 target 직접 open인지 확인합니다.", "예외를 write 중간에 주입해 원본을 비교합니다.", "temp와 target이 같은 filesystem인지 봅니다."], fix: "같은 directory temp에 완전히 쓴 뒤 close하고 os.replace합니다.", prevention: "write·flush·fsync·replace 각 단계 fault injection과 원본 보존 테스트를 둡니다." },
      { symptom: "atomic replace를 썼는데 두 writer 중 한쪽 변경이 사라진다.", likelyCause: "이름 교체의 atomic visibility를 read-modify-write 동시성 제어로 오해해 last-writer-wins가 발생했습니다.", checks: ["각 writer가 읽은 base version을 기록합니다.", "replace 시각과 lock/CAS 사용 여부를 봅니다.", "동시 실행 stress test를 수행합니다."], fix: "version compare-and-swap, lock, single writer 또는 transaction storage를 사용합니다.", prevention: "atomicity·durability·isolation을 별도 요구사항과 테스트로 관리합니다." },
    ],
    expertNotes: ["os.replace 성공이 모든 저장 매체에서 전원 손실 후 새 directory entry 생존을 보장한다는 뜻은 아니며 제품 durability 등급에 맞춰 directory sync와 storage 문서를 확인합니다.", "권한·ownership·extended attributes를 새 파일에 어떻게 보존할지도 replace 프로토콜 일부입니다."],
  },
  {
    id: "path-traversal-symlink-and-toctou-boundaries",
    title: "외부 경로 입력을 root 아래로 제한하고 traversal·symlink·TOCTOU 경계를 구분합니다",
    lead: "`root / user_input`은 안전한 sandbox가 아닙니다. 절대 경로와 `..`, symlink가 root 밖을 가리킬 수 있고, 검사와 open 사이 filesystem 상태가 바뀔 수 있으므로 lexical 정규화와 실제 object 접근을 하나의 보안 경계로 설계해야 합니다.",
    explanations: [
      "외부 문자열을 Path로 바꿀 때 absolute path면 앞의 root를 무시할 수 있고 `..`는 상위로 이동합니다. `candidate = (root / user).resolve()` 후 `candidate.relative_to(root.resolve())`가 성공하는지 확인하면 현재 시점의 canonical path가 root 아래인지 검증할 수 있습니다. 단순 문자열 startswith는 `/safe/data2`를 `/safe/data` 아래로 오인하고 대소문자·separator 문제도 있습니다.",
      "Path.resolve는 `..`를 제거하고 symlink를 따라 실제 경로를 계산합니다. strict=True는 존재하지 않거나 loop인 path에서 오류를 내고, strict=False는 존재하는 prefix까지만 해결합니다. 새 파일 생성에서는 parent를 strict resolve한 뒤 허용 leaf name을 별도로 검증하는 편이 낫습니다.",
      "확인 뒤 open하기 전 공격자가 symlink나 directory를 바꾸면 check-time-to-use race가 생깁니다. 높은 신뢰 경계에서는 이미 연 directory descriptor를 기준으로 상대 open을 수행하고 플랫폼이 지원하면 dir_fd·O_NOFOLLOW 등을 사용하며, ownership/permission과 mount 정책을 함께 제한합니다. pathlib resolve+open만으로 적대적 동시 변경에 완전한 보안을 주장하지 않습니다.",
      "symlink 허용 정책을 정해야 합니다. 사용자 workspace 안 symlink가 유용할 수 있지만 root 밖 link를 따라가면 격리가 깨집니다. 업로드 저장소는 symlink 자체를 거부하거나 최종 object가 root 아래임을 descriptor 기반으로 확인합니다. Windows reparse point·junction도 고려합니다.",
      "exclusive mode `x`는 같은 이름이 이미 있으면 실패하므로 존재 확인 후 w로 여는 TOCTOU를 줄입니다. 하지만 parent directory 교체와 symlink race까지 모두 해결하지는 않습니다. 안전한 temp 생성에는 tempfile의 즉시 생성 API를 사용합니다.",
      "사용자에게 오류를 반환할 때 서버의 절대 root path를 노출하지 않습니다. 허용되지 않은 경로라는 domain error code와 정규화된 상대 식별자만 기록하고, 입력 원문에 제어문자·비밀이 있을 수 있음을 고려합니다.",
    ],
    concepts: [
      { term: "path traversal", definition: "외부 경로의 절대 경로·`..`·symlink 등을 이용해 의도한 root 밖 파일에 접근하는 취약점입니다.", detail: ["문자열 prefix 비교로 막을 수 없습니다.", "읽기와 쓰기 모두 영향받습니다."] },
      { term: "TOCTOU", definition: "filesystem 상태를 검사한 시점과 실제 사용하는 시점 사이에 상태가 바뀌어 검증 전제가 깨지는 race입니다.", detail: ["resolve 뒤 open 사이 symlink 교체가 예입니다.", "descriptor-relative 원자적 API로 범위를 줄입니다."] },
      { term: "exclusive create", definition: "대상 이름이 이미 존재하면 실패하도록 파일을 원자적으로 생성하는 x mode 또는 O_EXCL 의미입니다.", detail: ["exists 검사 뒤 open보다 race가 적습니다.", "부모 경로 보안은 별도로 필요합니다."] },
    ],
    codeExamples: [
      {
        id: "resolved-root-containment",
        title: "resolve와 relative_to로 root containment 검증",
        language: "python",
        filename: "safe_paths.py",
        purpose: "격리 임시 root에서 정상 상대 경로와 `..`·절대 경로를 구분하되 실제 절대 경로를 출력하지 않습니다.",
        code: "from pathlib import Path\nfrom tempfile import TemporaryDirectory\n\ndef safe_path(root, user_path):\n    resolved_root = root.resolve(strict=True)\n    candidate = (resolved_root / user_path).resolve(strict=False)\n    try:\n        relative = candidate.relative_to(resolved_root)\n    except ValueError as error:\n        raise ValueError('path escapes root') from error\n    if relative == Path('.'):\n        raise ValueError('file path required')\n    return candidate\n\nwith TemporaryDirectory() as directory:\n    root = Path(directory) / 'uploads'\n    root.mkdir()\n    absolute_escape = root.parent / 'outside.txt'\n    cases = [('normal', 'notes/a.txt'), ('parent', '../outside.txt'), ('absolute', str(absolute_escape))]\n    for label, raw in cases:\n        try:\n            safe_path(root, raw)\n            print(f'{label}:accepted')\n        except ValueError:\n            print(f'{label}:rejected')",
        walkthrough: [
          { lines: "1-12", explanation: "존재하는 root를 strict resolve하고 candidate를 정규화한 뒤 path-aware relative_to로 root 포함 관계를 검사합니다." },
          { lines: "14-18", explanation: "실제 사용자 경로와 격리된 임시 uploads root, root 밖 absolute 합성 경로를 준비합니다." },
          { lines: "19-25", explanation: "정상·parent traversal·absolute escape 결과만 label로 출력해 host 절대 경로를 노출하지 않습니다." },
        ],
        run: { environment: ["Python 3.8 이상", "safe_paths.py를 UTF-8로 저장"], command: "python -I -X utf8 safe_paths.py" },
        output: { value: "normal:accepted\nparent:rejected\nabsolute:rejected", explanation: ["정상 상대 경로는 root 아래로 resolve됩니다.", "`..`와 root 밖 absolute path는 relative_to에 실패해 거부됩니다.", "이 검사는 현재 snapshot의 containment이며 적대적 TOCTOU까지 완전히 해결하지는 않습니다."] },
        experiments: [
          { change: "containment를 문자열 `str(candidate).startswith(str(root))`로 바꿉니다.", prediction: "root와 prefix만 같은 sibling 경로를 잘못 허용할 수 있습니다.", result: "filesystem component 인식 relative_to가 필요한 이유를 확인합니다." },
          { change: "exists()로 없음 확인 뒤 w mode로 만들도록 바꿉니다.", prediction: "검사와 생성 사이 다른 process가 같은 이름을 만들 수 있습니다.", result: "x mode·tempfile처럼 검사와 생성을 결합한 API가 필요한 이유를 확인합니다." },
        ],
        sourceRefs: ["python-pathlib-doc-024", "python-os-open-doc-024", "python-tempfile-doc-024", "python-open-doc", "py-day05-file-note"],
      },
    ],
    diagnostics: [
      { symptom: "root를 붙였는데도 외부 absolute path 파일이 열렸다.", likelyCause: "Path 결합에서 오른쪽 absolute path가 앞 root를 대체했고 containment 검증이 없었습니다.", checks: ["user path의 is_absolute를 확인합니다.", "결합 후 resolve 결과를 민감정보 없이 비교합니다.", "Windows drive·UNC·junction 입력 fixture를 포함합니다."], fix: "absolute 입력을 거부하고 canonical candidate가 canonical root에 relative_to 가능한지 검증합니다.", prevention: "경로 입력 parser를 한 함수로 중앙화하고 플랫폼별 traversal corpus를 테스트합니다." },
      { symptom: "resolve 검사 직후인데 가끔 root 밖 파일이 열리는 보안 사고가 난다.", likelyCause: "검사와 open 사이 symlink·directory가 교체되는 TOCTOU race입니다.", checks: ["공유 directory의 write 권한과 symlink 생성 권한을 확인합니다.", "resolve와 open 사이 호출을 추적합니다.", "dir_fd·O_NOFOLLOW 지원과 실제 사용을 확인합니다."], fix: "신뢰 경계를 줄이고 열린 directory descriptor 기준의 상대·no-follow 접근과 권한 격리를 적용합니다.", prevention: "path 문자열 검증만으로 race-free라고 주장하지 않고 플랫폼별 보안 API와 공격적 race test를 사용합니다." },
    ],
    comparisons: [
      { title: "새 파일을 어떤 방식으로 만들까요?", options: [
        { name: "x mode / tempfile", chooseWhen: "기존 파일을 덮지 않거나 안전한 임시 이름을 즉시 생성해야 할 때", avoidWhen: "기존 target을 완성된 새 내용으로 교체해야 할 때 x mode만으로 충분하다고 생각할 때", tradeoffs: ["check-then-create race를 줄입니다.", "tempfile은 예측 불가능 이름과 cleanup 도구를 제공합니다.", "최종 교체는 os.replace와 결합합니다."] },
        { name: "w mode / atomic replace", chooseWhen: "덮어쓰기가 의도되고 완성된 새 버전으로 교체해야 할 때", avoidWhen: "target을 w로 직접 열어 중간 실패 원본 손실을 허용할 수 없을 때", tradeoffs: ["직접 w는 단순하지만 즉시 truncate합니다.", "temp+replace는 코드와 durability 결정이 더 필요합니다.", "동시 writer isolation은 별도입니다."] },
      ] },
    ],
    expertNotes: ["보안 경로 처리는 application root containment뿐 아니라 OS 권한·container mount·service account 최소 권한을 중첩해야 합니다.", "파일 확장자·MIME 검사는 path traversal 방지와 다른 문제이며 업로드 contents는 별도 parser sandbox·크기 제한이 필요합니다."],
  },
);

expertSession.reviewQuestions.push(
  { question: "text mode에서 encoding을 생략하면 어떤 위험이 있나요?", answer: "locale 기본 encoding에 의존해 다른 환경에서 decode 결과가 달라지거나 UnicodeDecodeError와 데이터 손실이 발생할 수 있습니다." },
  { question: "newline=None과 newline='' 읽기의 차이는 무엇인가요?", answer: "둘 다 여러 line ending을 인식하지만 None은 반환 문자열을 `\n`으로 변환하고 빈 문자열은 원래 line terminator를 보존합니다." },
  { question: "flush와 fsync는 같은가요?", answer: "아닙니다. flush는 Python buffer를 OS에 전달하고 fsync는 file descriptor data를 저장 장치에 동기화하도록 OS에 요청합니다." },
  { question: "atomic replace가 lost update도 막나요?", answer: "아닙니다. 부분 파일 관찰을 막는 atomic visibility와 여러 writer의 isolation은 별도이며 lock·version CAS·transaction이 필요합니다." },
  { question: "문자열 startswith로 root containment를 검사하면 왜 안 되나요?", answer: "filesystem component 경계를 모르므로 비슷한 prefix sibling을 허용하고 대소문자·separator·symlink 의미도 제대로 처리하지 못합니다." },
  { question: "resolve 후 relative_to 검사가 모든 symlink 공격을 막나요?", answer: "현재 시점 containment에는 유용하지만 검사와 open 사이 상태 변경 TOCTOU를 막지는 못합니다. 높은 신뢰 경계에는 descriptor-relative no-follow 접근과 권한 격리가 필요합니다." },
  { question: "exists 확인 후 w로 만드는 것과 x mode의 차이는 무엇인가요?", answer: "exists+open은 두 연산 사이 race가 있지만 x mode는 이미 존재하면 실패하는 생성 검사를 하나의 open 연산으로 결합합니다." },
);

expertSession.completionChecklist.push(
  "text mode의 encoding·errors·newline·buffering을 파일 포맷 계약으로 명시할 수 있다.",
  "r·w·a·x·+·b mode의 데이터 보존과 위치 의미를 구분할 수 있다.",
  "with 정상·return·예외 경로에서 file lifetime과 cleanup을 검증할 수 있다.",
  "같은 directory temp→write→flush→fsync→close→os.replace 순서를 구현할 수 있다.",
  "atomic visibility·power-loss durability·동시 writer isolation을 서로 구분할 수 있다.",
  "resolve·relative_to 기반 root containment와 절대·`..`·symlink 입력을 테스트할 수 있다.",
  "TOCTOU 한계를 설명하고 dir_fd·no-follow·OS 최소 권한이 필요한 보안 경계를 식별할 수 있다.",
);

expertSession.sources.push(
  { id: "python-pathlib-doc-024", repository: "Python", path: "library/pathlib.html", publicUrl: "https://docs.python.org/3/library/pathlib.html", usedFor: ["Path 결합", "resolve", "relative_to", "read_text/write_text"], evidence: "object-oriented path 연산과 symlink를 포함한 resolve·component 기반 relative_to 의미를 확인했습니다." },
  { id: "python-io-doc-024", repository: "Python", path: "library/io.html", publicUrl: "https://docs.python.org/3/library/io.html", usedFor: ["text I/O", "encoding", "newline", "buffering"], evidence: "raw·buffered·text I/O 계층과 TextIOWrapper의 변환 책임을 확인했습니다." },
  { id: "python-tempfile-doc-024", repository: "Python", path: "library/tempfile.html", publicUrl: "https://docs.python.org/3/library/tempfile.html", usedFor: ["TemporaryDirectory", "mkstemp", "안전한 즉시 생성", "cleanup"], evidence: "고수준 context manager와 mkstemp의 안전한 임시 파일 생성, deprecated mktemp race 경고를 확인했습니다." },
  { id: "python-os-replace-doc-024", repository: "Python", path: "library/os.html#os.replace", publicUrl: "https://docs.python.org/3/library/os.html#os.replace", usedFor: ["atomic replace", "같은 filesystem", "target 교체"], evidence: "os.replace의 기존 target 교체와 cross-filesystem 실패 경계를 확인했습니다." },
  { id: "python-os-fsync-doc-024", repository: "Python", path: "library/os.html#os.fsync", publicUrl: "https://docs.python.org/3/library/os.html#os.fsync", usedFor: ["flush 후 fsync", "durability", "descriptor"], evidence: "buffered file object에서 flush 후 fsync를 호출해야 하는 순서를 공식 문서에서 확인했습니다." },
  { id: "python-os-open-doc-024", repository: "Python", path: "library/os.html#os.open", publicUrl: "https://docs.python.org/3/library/os.html#os.open", usedFor: ["dir_fd", "O_NOFOLLOW", "descriptor-relative open", "exclusive flag"], evidence: "플랫폼별 low-level open flags와 directory descriptor 기반 경로 접근 경계를 확인했습니다." },
);
