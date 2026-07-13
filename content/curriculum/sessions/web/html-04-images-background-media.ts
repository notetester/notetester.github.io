import type { DetailedSession } from "../../types";

const session = {
  schemaVersion: 2,
  inventoryIds: ["html-04-images-background-media"],
  slug: "html-04-images-background-media",
  courseId: "web",
  moduleId: "01-html-document-forms",
  order: 4,
  title: "이미지·배경·오디오·비디오·iframe의 선택 기준",
  subtitle: "보이는 미디어를 넣는 법을 넘어, 콘텐츠와 장식의 의미·대체 텍스트·크기 예약·재생 제어·자막·외부 문서 권한을 함께 설계합니다.",
  level: "기초",
  estimatedMinutes: 140,
  coreQuestion: "이미지나 미디어를 페이지에 넣을 때 어떤 요소를 선택하고, 원본이 느리거나 깨지거나 보이지·들리지 않아도 정보와 조작을 어떻게 보존할까요?",
  summary: "원본의 img 크기·alt·링크 이미지, float 텍스트 감싸기, background-size contain, video/audio source 후보, object 설명, 내부·외부 iframe을 감사합니다. 콘텐츠 이미지는 img와 의미 있는 alt로, 장식은 CSS background로 분리합니다. width/height로 aspect ratio 공간을 예약하고 srcset·sizes·picture로 조건에 맞는 이미지 후보를 제공합니다. float는 문서 흐름의 레거시 감싸기 용도로 제한하고 현대 레이아웃은 flex/grid를 선택합니다. audio/video에는 controls·적절한 preload·자막·대본·다운로드 대안을 두며, autoplay는 사용자 통제와 정책을 존중합니다. iframe은 독립 문서를 삽입하므로 title·sandbox·allow·referrerpolicy·lazy loading과 상대 사이트 정책을 최소 권한으로 검토합니다.",
  objectives: [
    "정보를 전달하는 이미지와 순수 장식 이미지를 구분해 img·alt 또는 CSS background를 선택할 수 있다.",
    "img의 width·height가 intrinsic aspect ratio를 알려 레이아웃 이동을 줄이는 과정을 설명할 수 있다.",
    "srcset·sizes와 picture/source가 해상도·뷰포트·포맷 조건에 따라 후보를 제공하는 차이를 구현할 수 있다.",
    "float가 텍스트 감싸기를 만드는 원리와 clear·flow-root, flex/grid를 선택할 경계를 설명할 수 있다.",
    "audio/video의 controls·source·preload·autoplay·muted·track과 별도 대본 링크를 접근성 관점에서 설계할 수 있다.",
    "object·iframe·native media의 책임과 fallback 차이를 비교할 수 있다.",
    "iframe에 title·sandbox·allow·referrerpolicy·loading을 최소 권한으로 설정하고 삽입 실패를 진단할 수 있다.",
  ],
  prerequisites: [
    {
      title: "링크, URL, 상대·절대 경로와 페이지 내 탐색",
      reason: "img src, source srcset, media src, iframe src는 모두 현재 문서 URL을 기준으로 해석됩니다. 상대 경로가 깨졌을 때 기준 URL을 추적할 수 있어야 합니다.",
      sessionSlug: "html-03-links-paths-navigation",
    },
    {
      title: "문서 구조와 인라인·블록 흐름",
      reason: "img는 문장 흐름에 참여하는 replaced element이고 figure, video, iframe은 주변 문서 구조와 관계를 맺으므로 기본 흐름을 알아야 합니다.",
    },
  ],
  keywords: ["HTML", "img", "alt", "figure", "picture", "srcset", "sizes", "background-image", "float", "audio", "video", "track", "iframe", "sandbox", "accessibility", "CLS"],
  chapters: [
    {
      id: "media-decision-model",
      title: "먼저 미디어의 역할을 콘텐츠·장식·독립 문서로 분류합니다",
      lead: "파일 확장자보다 사용자가 그 미디어 없이도 같은 의미와 작업을 얻을 수 있는지를 먼저 묻습니다.",
      explanations: [
        "상품 사진, 도표, 인물 사진처럼 문서의 의미를 전달하는 시각 자료는 img로 넣습니다. img는 문서 콘텐츠이고 alt로 텍스트 대안을 제공할 수 있으며 링크 안에 놓이면 링크의 목적도 전달합니다. 이미지가 사라지면 정보가 빠진다면 대체로 콘텐츠 이미지입니다.",
        "색감·무늬·분위기만 만드는 배경은 CSS background-image가 자연스럽습니다. 장식은 접근성 트리에서 별도 이름을 가질 필요가 없고 로딩에 실패해도 문장과 조작이 남아야 합니다. 중요한 텍스트를 배경 이미지에만 그려 넣으면 검색·번역·확대·고대비 모드와 이미지 실패에서 정보가 사라집니다.",
        "오디오와 비디오는 시간 기반 콘텐츠입니다. 그림 alt 한 문장만으로 대체할 수 없으므로 재생 컨트롤, 자막, 대본, 오디오 설명 등 시간축에 맞는 대안이 필요합니다. 브라우저가 재생할 수 있는 형식과 사용자가 조작할 수 있는 인터페이스도 함께 설계합니다.",
        "iframe과 object는 현재 문서 안에 다른 리소스나 독립 browsing context를 넣습니다. 특히 iframe은 외부 문서의 실행·권한·쿠키·탐색을 포함할 수 있어 단순 시각 요소보다 강한 신뢰 경계입니다. 가능한 경우 native img/audio/video를 우선하고 정말 독립 문서를 삽입해야 할 때 iframe을 사용합니다.",
      ],
      concepts: [
        {
          term: "replaced element",
          definition: "브라우저가 HTML 자식 내용 대신 외부 리소스나 별도 표현으로 바꾸어 렌더링하는 요소입니다.",
          detail: [
            "img, video, iframe 등이 대표적이며 자체 intrinsic dimensions를 가질 수 있습니다.",
            "주변 CSS box에는 참여하지만 내부 표현은 일반 텍스트 요소처럼 자식 CSS로 직접 꾸미기 어렵습니다.",
          ],
        },
        {
          term: "콘텐츠 이미지",
          definition: "문서의 정보·기능·링크 목적을 전달하는 이미지입니다.",
          detail: [
            "img와 상황에 맞는 alt를 사용합니다.",
            "복잡한 도표는 짧은 alt와 별도 상세 설명을 조합합니다.",
          ],
        },
        {
          term: "장식 이미지",
          definition: "제거해도 정보와 기능이 변하지 않는 시각적 장식입니다.",
          detail: [
            "CSS background로 두면 문서 의미와 분리하기 쉽습니다.",
            "img를 써야 하는 구조라면 alt=' '가 아니라 정확히 alt=''로 비워 보조기기가 건너뛰게 합니다.",
          ],
          caveat: "같은 파일도 문맥에 따라 콘텐츠 또는 장식이 됩니다. 파일 이름이나 예쁜 정도가 아니라 현재 페이지에서의 역할로 결정합니다.",
        },
      ],
      codeExamples: [],
      diagnostics: [],
      comparisons: [
        {
          title: "어떤 삽입 방식을 선택할까요?",
          options: [
            {
              name: "img·picture",
              chooseWhen: "이미지 자체가 문서 정보이고 alt·반응형 후보·다운로드 우선순위를 제어할 때",
              avoidWhen: "순수 장식이거나 완전한 외부 웹 문서를 삽입할 때",
              tradeoffs: ["접근 가능한 이름과 intrinsic size를 제공합니다.", "이미지 최적화·대체 텍스트 품질을 관리해야 합니다.", "picture로 art direction과 포맷 후보를 줄 수 있습니다."],
            },
            {
              name: "CSS background-image",
              chooseWhen: "콘텐츠와 무관한 무늬·질감·hero 장식이 필요할 때",
              avoidWhen: "이미지 안 정보가 본문 이해·조작에 필수일 때",
              tradeoffs: ["콘텐츠 의미와 장식을 분리합니다.", "alt 속성이 없으므로 중요한 정보에는 부적합합니다.", "cover에서 일부가 잘릴 수 있습니다."],
            },
            {
              name: "audio·video·iframe",
              chooseWhen: "시간 기반 미디어 또는 독립 문서가 실제로 필요할 때",
              avoidWhen: "정적 이미지나 텍스트로 같은 목적을 더 안전하게 달성할 때",
              tradeoffs: ["풍부한 콘텐츠와 독립 앱을 제공할 수 있습니다.", "접근성 대안·대역폭·권한·개인정보 비용이 큽니다.", "브라우저 정책과 상대 서버 삽입 정책에 영향을 받습니다."],
            },
          ],
        },
      ],
    },
    {
      id: "img-alt-dimensions",
      title: "img는 경로·대체 텍스트·크기 예약을 한 계약으로 가집니다",
      lead: "src가 이미지를 찾고 alt가 의미를 보존하며 width·height가 로드 전 레이아웃 공간을 예약합니다.",
      explanations: [
        "src는 현재 문서 URL을 기준으로 이미지 리소스를 찾습니다. 원본 ex03은 ../images/bear.jpg를 사용하고 실제 파일은 320×320 JPEG입니다. 상대 경로가 틀리거나 서버가 다른 content-type을 보내면 이미지가 표시되지 않으므로 Network 패널의 최종 URL·상태 코드·응답 형식을 확인합니다.",
        "alt는 파일 이름 설명이 아니라 이미지가 현재 문맥에서 수행하는 목적의 텍스트 대안입니다. 단순 사진이면 '갈색 곰이 정면을 바라보는 모습'처럼 필요한 정보를 간결하게 씁니다. 주변 figcaption이 같은 정보를 이미 말하면 반복을 줄입니다. 링크 안에 이미지 하나만 있다면 alt가 링크 목적을 설명해야 합니다. 원본의 alt='곰'은 입문용으로는 동작하지만 실제 페이지에서는 왜 곰 사진이 있는지 문맥을 반영해야 합니다.",
        "width와 height HTML 속성에는 CSS 단위가 없는 정수 pixel dimension을 사용합니다. width='320' height='320'은 원본 이미지의 aspect ratio를 브라우저에 알려 파일이 오기 전 1:1 공간을 예약합니다. CSS로 width:100%; height:auto를 적용하면 반응형으로 줄어들면서 비율을 유지합니다. 원본처럼 한쪽만 지정하면 intrinsic ratio로 다른 축을 계산할 수 있지만, 두 intrinsic 값을 모두 제공하는 편이 레이아웃 이동 방지에 유리합니다.",
        "두 축을 원본 비율과 다르게 CSS로 강제하면 사진이 찌그러질 수 있습니다. 정해진 frame을 채워야 한다면 img의 width/height를 비율 왜곡에 쓰지 말고 wrapper 크기와 object-fit: cover 또는 contain을 사용합니다. cover는 box를 채우며 일부를 자르고 contain은 전체를 보여 주며 빈 공간을 남깁니다.",
        "title은 alt 대체물이 아닙니다. pointer hover가 없는 장치와 키보드·보조기기에서 일관된 설명 수단이 아니며 중요한 정보는 본문에 둡니다. 이미지 아래 설명은 figure와 figcaption으로 문서 관계를 표현할 수 있습니다.",
      ],
      concepts: [
        {
          term: "alt",
          definition: "이미지를 볼 수 없거나 사용하지 않을 때 이미지의 목적·정보를 대신하는 텍스트입니다.",
          detail: [
            "정보 이미지, 기능 이미지, 장식 이미지마다 작성 전략이 다릅니다.",
            "장식 img에는 alt=''를 사용해 불필요한 발표를 줄입니다.",
          ],
          caveat: "alt에 '이미지', '사진'을 기계적으로 반복하거나 파일명을 넣지 않습니다. 필요한 경우 매체 종류가 의미에 중요할 때만 포함합니다.",
        },
        {
          term: "intrinsic dimensions",
          definition: "이미지 파일 자체가 가진 고유 너비·높이와 비율 정보입니다.",
          detail: [
            "HTML width·height가 비율 힌트를 제공해 로드 전 공간을 예약할 수 있습니다.",
            "CSS 표시 크기와 원본 pixel 크기는 서로 다를 수 있습니다.",
          ],
        },
        {
          term: "layout shift",
          definition: "리소스 로드 뒤 요소 크기·위치가 바뀌어 이미 보이던 콘텐츠가 밀리는 현상입니다.",
          detail: [
            "이미지 크기 예약은 누적 레이아웃 이동(CLS)을 줄입니다.",
            "광고·embed·동적 폰트도 별도 크기 예약이 필요합니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "content-image-vs-decoration",
          title: "콘텐츠 img와 장식 background를 분리하고 자체 검증하기",
          language: "html",
          filename: "image_roles.html",
          purpose: "원본 bear·kitten 자산을 기준으로 정보 이미지에는 alt·고유 크기를, 장식에는 CSS background를 적용하고 DOM 속성을 페이지 안 검증 결과로 출력합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>이미지 역할 실험</title>\n  <style>\n    .content-image { max-width: 100%; height: auto; }\n    .decoration {\n      width: 320px; height: 160px;\n      background: url(\"images/kitten-1.jpg\") center / cover no-repeat;\n    }\n  </style>\n</head>\n<body>\n  <figure>\n    <img id=\"bear\" class=\"content-image\" src=\"images/bear.jpg\"\n         alt=\"갈색 곰이 정면을 바라보는 모습\" width=\"320\" height=\"320\">\n    <figcaption>야생동물 관찰 기록의 곰 사진</figcaption>\n  </figure>\n\n  <div id=\"decoration\" class=\"decoration\" aria-hidden=\"true\"></div>\n\n  <h2>검증 결과</h2>\n  <pre id=\"check\"></pre>\n  <script>\n    const image = document.querySelector('#bear');\n    const decoration = document.querySelector('#decoration');\n    document.querySelector('#check').textContent = [\n      'img.alt=' + JSON.stringify(image.alt),\n      'img.attributes=' + image.getAttribute('width') + 'x' + image.getAttribute('height'),\n      'img.loading=' + (image.loading || 'eager(default)'),\n      'decoration.aria-hidden=' + decoration.getAttribute('aria-hidden')\n    ].join('\\n');\n  </script>\n</body>\n</html>",
          walkthrough: [
            {
              lines: "9-12",
              explanation: "장식 box는 배경 이미지를 center/cover로 채웁니다. 중요한 텍스트나 조작은 이 배경에 의존하지 않습니다.",
            },
            {
              lines: "16-20",
              explanation: "콘텐츠 이미지는 문맥형 alt와 실제 원본 320×320 크기를 HTML 속성으로 제공하고 CSS height:auto로 비율을 유지합니다.",
            },
            {
              lines: "23",
              explanation: "빈 장식 div는 aria-hidden=true로 접근성 트리에서 제외합니다. 장식 안에 텍스트·링크를 넣고 aria-hidden을 쓰면 함께 숨으므로 비워 둡니다.",
            },
            {
              lines: "27-36",
              explanation: "짧은 검증 스크립트가 alt·크기 속성·기본 loading·장식 숨김 상태를 pre에 써서 파일을 열었을 때 정확한 계약을 확인하게 합니다.",
            },
          ],
          run: {
            environment: ["최신 Chromium·Firefox·Safari 중 하나", "image_roles.html 옆 images 폴더에 bear.jpg(320×320)와 kitten-1.jpg 배치", "로컬 HTTP 서버"],
            command: "python -m http.server 8000",
            input: "브라우저에서 http://localhost:8000/image_roles.html을 엽니다.",
          },
          output: {
            value: "img.alt=\"갈색 곰이 정면을 바라보는 모습\"\nimg.attributes=320x320\nimg.loading=eager(default)\ndecoration.aria-hidden=true",
            explanation: [
              "검증 결과는 파일 로드 성공 여부와 별개로 HTML 계약을 정확히 보여 줍니다. 파일이 깨져도 alt는 남습니다.",
              "두 크기 속성은 1:1 비율 공간을 예약하고 CSS가 화면 폭에 맞춰 축소합니다.",
              "장식은 별도 접근 가능한 이름을 만들지 않으며 본문 정보는 figure·figcaption에 남습니다.",
            ],
          },
          experiments: [
            {
              change: "bear.jpg 경로를 존재하지 않는 파일로 바꿉니다.",
              prediction: "사진은 깨지지만 alt 텍스트와 figcaption, 검증 결과는 남습니다.",
              result: "콘텐츠 의미가 이미지 네트워크 성공에 완전히 의존하지 않는지 확인할 수 있습니다.",
            },
            {
              change: "CSS에 .content-image { width: 200px; height: 100px; }를 강제합니다.",
              prediction: "1:1 원본이 2:1 box로 늘어나 왜곡됩니다.",
              result: "crop이 목적이라면 aspect-ratio와 object-fit을 사용해야 함을 확인합니다.",
            },
          ],
          sourceRefs: ["web-img-source", "web-background-source", "web-image-assets", "wai-images"],
        },
      ],
      diagnostics: [
        {
          symptom: "이미지가 깨지고 alt 텍스트만 보이거나 빈 아이콘이 보인다.",
          likelyCause: "src 상대 경로 기준이 틀렸거나 파일명 대소문자·배포 경로·응답 상태/content-type이 맞지 않습니다.",
          checks: [
            "개발자 도구 Network에서 이미지 요청의 최종 URL·상태 코드·content-type을 확인합니다.",
            "현재 HTML URL을 기준으로 ../ 이동을 손으로 정규화합니다.",
            "로컬 Windows에서 통과한 대소문자가 Linux 배포에서도 정확한지 확인합니다.",
          ],
          fix: "배포되는 public 경로와 src를 일치시키고 서버가 올바른 image content-type과 캐시 정책으로 응답하게 합니다.",
          prevention: "빌드 시 asset 존재·대소문자 검사와 깨진 이미지 E2E 테스트를 실행합니다.",
        },
        {
          symptom: "이미지가 로드된 순간 아래 텍스트와 버튼이 크게 밀린다.",
          likelyCause: "브라우저가 로드 전에 이미지 비율·표시 공간을 알 수 있도록 width/height 또는 aspect-ratio를 제공하지 않았습니다.",
          checks: [
            "img에 실제 비율을 나타내는 정수 width·height 속성이 있는지 확인합니다.",
            "CSS가 aspect ratio를 다른 값으로 덮는지 확인합니다.",
            "Performance/Lighthouse에서 layout shift 원인을 확인합니다.",
          ],
          fix: "고유 width·height를 제공하고 반응형 CSS에는 max-width:100%; height:auto를 사용합니다.",
          prevention: "CMS가 원본 pixel 크기를 metadata로 제공하고 component가 항상 크기 속성을 출력하게 합니다.",
        },
      ],
    },
    {
      id: "responsive-image-selection",
      title: "srcset·sizes·picture는 브라우저가 적합한 이미지 후보를 고르게 합니다",
      lead: "CSS로 큰 이미지를 작게 보이게 하는 것만으로 전송 byte가 줄지는 않으므로 표시 조건과 실제 파일 후보를 함께 제공합니다.",
      explanations: [
        "srcset의 width descriptor는 bear-320.jpg 320w, bear-640.jpg 640w처럼 후보 파일의 고유 폭을 알려 줍니다. sizes는 현재 media 조건에서 이미지가 차지할 CSS 폭을 브라우저에 힌트로 줍니다. 브라우저는 viewport, device pixel ratio, cache와 네트워크 판단을 조합해 후보 하나를 선택합니다.",
        "picture는 art direction이나 포맷 선택에 사용합니다. 좁은 화면에는 주제가 크게 crop된 사진, 넓은 화면에는 가로 구도를 제공하거나 AVIF·WebP source 뒤에 일반 img fallback을 둡니다. img는 picture의 필수 fallback이자 alt·width·height의 중심입니다.",
        "srcset은 같은 의미·구도의 해상도 후보, picture media는 구도가 달라지는 art direction이라는 구분이 유용합니다. 모든 장치명을 나열하지 말고 콘텐츠가 깨지는 조건과 실제 표시 폭으로 설계합니다.",
        "loading='lazy'는 화면 밖 이미지를 늦춰 초기 전송을 줄일 수 있지만 첫 화면의 핵심 hero에 쓰면 LCP가 늦어집니다. 핵심 이미지는 기본 eager와 fetchpriority='high'를 신중히 검토하고 나머지 갤러리는 lazy를 사용합니다. decoding='async'도 표시 timing 힌트이지 접근성 대체가 아닙니다.",
      ],
      concepts: [
        {
          term: "srcset",
          definition: "같은 이미지 목적을 충족하는 여러 파일 후보와 고유 폭 또는 pixel density 정보를 제공하는 속성입니다.",
          detail: [
            "브라우저가 후보 중 하나를 선택하며 작성자가 특정 후보를 강제하는 API가 아닙니다.",
            "width descriptor를 쓰면 sizes와 실제 표시 폭을 함께 설계합니다.",
          ],
        },
        {
          term: "picture",
          definition: "media·type 조건별 source 후보와 필수 img fallback을 묶는 요소입니다.",
          detail: [
            "art direction과 최신 포맷 fallback에 사용합니다.",
            "접근 가능한 대체 텍스트는 내부 img에 둡니다.",
          ],
        },
        {
          term: "art direction",
          definition: "화면 조건에 따라 단순 축소가 아니라 crop·구도·내용 강조가 다른 이미지를 선택하는 전략입니다.",
          detail: [
            "모바일에서 주 피사체가 너무 작아지는 문제를 해결합니다.",
            "후보마다 전달 정보가 달라지지 않도록 편집 기준을 검토합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "srcset을 추가했는데도 항상 너무 큰 파일이 내려오거나 예상 후보와 다르다.",
          likelyCause: "sizes가 실제 CSS 폭과 다르거나 후보 width descriptor가 파일의 실제 고유 폭과 맞지 않거나 browser cache·DPR 판단을 무시했습니다.",
          checks: [
            "Network의 실제 currentSrc와 전송 byte를 확인합니다.",
            "DevTools DPR·viewport를 바꾸고 cache를 비운 뒤 재검사합니다.",
            "sizes media 조건과 computed CSS width가 일치하는지 비교합니다.",
          ],
          fix: "실제 layout 폭을 기준으로 sizes를 수정하고 후보 고유 폭 metadata를 정확히 기록합니다.",
          prevention: "대표 viewport·DPR 조합에서 currentSrc와 file size를 자동 측정합니다.",
        },
      ],
      expertNotes: [
        "이미지 최적화 CDN을 쓸 때 width·quality query를 사용자 입력 그대로 통과시키지 말고 허용 범위와 origin allowlist를 둬 SSRF·과도한 변환 비용을 막습니다.",
      ],
    },
    {
      id: "float-and-background-layout",
      title: "float는 텍스트 감싸기, background는 장식에 한정합니다",
      lead: "원본의 float:left/right는 이미지 옆으로 문단이 흐르는 전통적인 배치이며 전체 페이지 열 구조를 만드는 현대 기본 도구는 아닙니다.",
      explanations: [
        "float된 이미지는 일반 흐름에서 옆으로 밀리고 뒤의 inline 콘텐츠가 남은 공간을 감쌉니다. 원본은 500×600 이미지를 100px 폭으로 줄여 none, right, left를 비교합니다. float의 목적이 기사 속 사진과 본문 감싸기라면 여전히 적절합니다.",
        "float 자식만 있는 container는 높이가 collapse되어 다음 section이 올라올 수 있습니다. clear:both를 가진 요소를 추가하는 레거시 방법보다 container에 display:flow-root를 주어 새 block formatting context를 만드는 방식이 명확합니다. 문단과 이미지의 두 열, 카드 정렬, navigation은 flex나 grid가 더 예측 가능합니다.",
        "원본 배경은 320×213 kitten 이미지를 no-repeat, contain, fixed로 body에 둡니다. contain은 이미지를 전부 보여 주므로 viewport 비율과 다르면 빈 영역이 남습니다. cover는 영역을 채우지만 이미지 일부가 잘립니다. 어떤 crop에서도 정보가 유지되어야 하므로 중요한 얼굴·문자에는 object-position·art direction 또는 콘텐츠 img를 검토합니다.",
        "background-attachment:fixed는 모바일 브라우저에서 성능·지원 차이가 있고 motion·scroll 경험을 해칠 수 있습니다. 고정 배경을 핵심 기능으로 만들지 말고 저사양·reduced motion·모바일에서 단순화합니다.",
      ],
      concepts: [
        {
          term: "float",
          definition: "요소를 inline 흐름 한쪽으로 밀고 뒤 콘텐츠가 주변을 감싸게 하는 CSS 배치 기능입니다.",
          detail: [
            "기사 이미지 감싸기에 적합합니다.",
            "전체 component layout에는 flex/grid가 대개 더 명확합니다.",
          ],
        },
        {
          term: "clear",
          definition: "앞선 float 요소 옆으로 올라가지 않고 지정한 float 아래에서 시작하게 하는 CSS 속성입니다.",
          detail: [
            "legacy 문서 흐름 정리에 쓰입니다.",
            "float container 높이 문제에는 flow-root도 검토합니다.",
          ],
        },
        {
          term: "cover·contain",
          definition: "배경 또는 replaced content를 box에 맞추는 두 비율 유지 전략입니다.",
          detail: [
            "cover는 box를 모두 채우고 넘치는 부분을 자릅니다.",
            "contain은 전체 미디어를 보이고 남는 공간을 허용합니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "float 이미지 다음 section이 이미지 옆이나 위로 올라와 겹친다.",
          likelyCause: "부모 높이가 float 자식 높이를 포함하지 못하거나 다음 콘텐츠가 float을 clear하지 않았습니다.",
          checks: [
            "DevTools box model에서 부모 computed height를 확인합니다.",
            "float이 정말 텍스트 감싸기 목적인지 먼저 확인합니다.",
            "container에 display:flow-root를 임시 적용해 비교합니다.",
          ],
          fix: "감싸기 목적이면 부모에 flow-root를 적용하고, 열 layout이면 float을 제거해 flex/grid로 재구성합니다.",
          prevention: "float component 뒤 긴·짧은 콘텐츠, 좁은 폭, 이미지 실패 상태를 visual regression으로 검사합니다.",
        },
        {
          symptom: "background-size:cover에서 사람 얼굴이나 핵심 부분이 잘린다.",
          likelyCause: "box와 이미지 aspect ratio가 달라 cover가 영역을 채우기 위해 일부를 crop합니다.",
          checks: [
            "여러 viewport에서 crop 영역과 background-position을 확인합니다.",
            "이미지가 정말 장식인지 정보인지 재분류합니다.",
            "contain·picture art direction·콘텐츠 img 대안을 비교합니다.",
          ],
          fix: "장식이면 안전한 focal point와 background-position을 정하고, 정보 이미지이면 img/picture로 전환해 전체 의미를 보존합니다.",
          prevention: "CMS에 focal point를 저장하고 대표 aspect ratio마다 승인 이미지를 생성합니다.",
        },
      ],
    },
    {
      id: "audio-video-accessibility",
      title: "audio·video는 재생 파일뿐 아니라 제어·자막·대본 계약입니다",
      lead: "controls 하나로 최소 조작을 제공하고, source 후보·track·대본·다운로드 경로로 브라우저와 사용자 능력 차이를 보완합니다.",
      explanations: [
        "원본은 video src 한 개, 여러 source 후보, controls, autoplay, muted, loop와 audio 예제를 포함합니다. source를 여러 개 두면 브라우저가 지원하는 type 후보를 순서대로 시도합니다. 서버가 올바른 MIME type과 byte range를 지원해야 seek와 streaming이 안정적입니다.",
        "controls는 play, pause, seek, volume 같은 사용자 조작을 브라우저 UI로 제공합니다. 사용자 정의 controls를 만들면 keyboard, focus, accessible name, 상태 발표, full screen, captions를 모두 다시 구현해야 하므로 native controls를 먼저 사용합니다.",
        "autoplay는 브라우저 정책에 의해 차단될 수 있고 소리가 있는 자동 재생은 놀람·인지 부담·데이터 사용을 만듭니다. 원본처럼 muted를 함께 두면 정책상 허용 가능성이 높아지지만 사용자가 원하지 않는 motion과 전송은 남습니다. 핵심 설명 영상은 자동 재생하지 않고 사용자가 시작하게 합니다.",
        "video의 track kind='captions'는 대사뿐 아니라 중요한 소리 정보를 시간에 맞춰 제공합니다. 자막 파일은 WebVTT 형식·언어·label·default를 정확히 둡니다. 별도의 대본은 검색·빠른 읽기·점자·번역에 유용하며, 시각 정보가 중요한 영상에는 audio description 또는 본문 설명이 필요합니다.",
        "video/audio 요소 안의 fallback 문구는 요소 자체를 지원하지 않는 오래된 user agent용입니다. 현대 브라우저에서 모든 source 로드가 실패했다고 그 문구가 반드시 사용자에게 보이는 오류 UI가 되는 것은 아닙니다. 따라서 요소 밖에 대본·직접 다운로드 링크와 오류 처리 정책을 둡니다.",
        "preload='metadata'는 길이·크기 같은 metadata만 우선 가져오는 힌트이고 preload='none'은 사용자가 시작하기 전 전송을 줄입니다. 브라우저가 힌트를 완전히 따를 의무는 없습니다. poster와 width/height로 영상 box를 예약해 layout shift를 줄입니다.",
      ],
      concepts: [
        {
          term: "source 후보",
          definition: "audio/video/picture가 지원 형식·media 조건에 따라 선택할 수 있도록 제공한 리소스 목록입니다.",
          detail: [
            "type을 정확히 제공하면 브라우저가 불필요한 다운로드 없이 후보를 판단할 수 있습니다.",
            "후보 파일이 실제 서버에 존재하고 올바른 MIME으로 응답하는지 확인합니다.",
          ],
        },
        {
          term: "WebVTT track",
          definition: "video의 시간 구간에 맞춘 captions·subtitles·descriptions 등의 텍스트 cue 파일입니다.",
          detail: [
            "kind, srclang, label을 제공해 사용자가 선택할 수 있게 합니다.",
            "자동 생성 자막은 사람 검수를 거쳐 고유명사·전문용어·소리 정보를 교정합니다.",
          ],
        },
        {
          term: "preload",
          definition: "페이지 로드 시 미디어를 어느 정도 미리 가져올지 브라우저에 주는 힌트입니다.",
          detail: [
            "none, metadata, auto 값을 목적에 맞게 선택합니다.",
            "힌트이므로 실제 네트워크 동작은 브라우저·정책에 따라 다를 수 있습니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "responsive-picture-and-accessible-media",
          title: "picture 후보와 접근 가능한 video/audio를 함께 검증하기",
          language: "html",
          filename: "responsive_media.html",
          purpose: "반응형 이미지 source, native controls, preload, video captions와 외부 대본·다운로드 링크를 구성하고 DOM 계약을 정확한 텍스트로 출력합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>반응형 이미지와 미디어</title>\n</head>\n<body>\n  <picture id=\"lesson-picture\">\n    <source type=\"image/avif\" srcset=\"images/lesson-640.avif 640w, images/lesson-1280.avif 1280w\">\n    <source media=\"(max-width: 600px)\" srcset=\"images/lesson-mobile.jpg\">\n    <img src=\"images/lesson-1280.jpg\" alt=\"코드와 실행 결과를 나란히 보여 주는 학습 화면\"\n         width=\"1280\" height=\"720\" sizes=\"(max-width: 600px) 100vw, 800px\"\n         loading=\"lazy\" decoding=\"async\">\n  </picture>\n\n  <video id=\"lesson-video\" controls preload=\"metadata\" width=\"640\" height=\"360\"\n         poster=\"images/lesson-poster.jpg\">\n    <source src=\"media/lesson.webm\" type=\"video/webm\">\n    <source src=\"media/lesson.mp4\" type=\"video/mp4\">\n    <track kind=\"captions\" src=\"media/lesson-ko.vtt\" srclang=\"ko\" label=\"한국어\" default>\n    이 브라우저는 video 요소를 지원하지 않습니다.\n  </video>\n  <p><a href=\"lesson-transcript.html\">영상 대본 읽기</a> · <a href=\"media/lesson.mp4\" download>영상 다운로드</a></p>\n\n  <audio id=\"lesson-audio\" controls preload=\"none\">\n    <source src=\"media/summary.ogg\" type=\"audio/ogg\">\n    <source src=\"media/summary.mp3\" type=\"audio/mpeg\">\n  </audio>\n\n  <h2>검증 결과</h2>\n  <pre id=\"check\"></pre>\n  <script>\n    const picture = document.querySelector('#lesson-picture');\n    const video = document.querySelector('#lesson-video');\n    const audio = document.querySelector('#lesson-audio');\n    document.querySelector('#check').textContent = [\n      'picture.sources=' + picture.querySelectorAll('source').length,\n      'video.controls=' + video.controls + '; autoplay=' + video.autoplay + '; preload=' + video.preload,\n      'video.tracks=' + video.querySelectorAll('track[kind=\"captions\"]').length,\n      'audio.controls=' + audio.controls + '; autoplay=' + audio.autoplay + '; preload=' + audio.preload\n    ].join('\\n');\n  </script>\n</body>\n</html>",
          walkthrough: [
            {
              lines: "8-14",
              explanation: "picture는 AVIF 포맷 후보와 좁은 화면 art direction 후보를 제공하고 img가 최종 fallback·alt·크기·sizes를 담당합니다.",
            },
            {
              lines: "16-23",
              explanation: "video는 자동 재생 없이 native controls를 제공하고 metadata만 preload합니다. WebM·MP4 후보와 한국어 captions track을 둡니다.",
            },
            {
              lines: "24",
              explanation: "대본과 다운로드 링크를 video 밖에 두어 source 재생 실패와 사용자 선호에도 접근 가능한 경로를 남깁니다.",
            },
            {
              lines: "26-29",
              explanation: "audio는 사용자가 재생하기 전 preload를 줄이고 두 형식 후보를 제공합니다.",
            },
            {
              lines: "33-42",
              explanation: "검증 스크립트가 후보 수와 controls·autoplay·preload·captions 계약을 pre에 기록합니다. 미디어 파일이 없어도 HTML 계약 자체는 확인할 수 있습니다.",
            },
          ],
          run: {
            environment: ["최신 브라우저", "responsive_media.html과 images/media 자산 폴더", "WebVTT 자막 파일", "로컬 HTTP 서버"],
            command: "python -m http.server 8000",
            input: "브라우저에서 http://localhost:8000/responsive_media.html을 열고 검증 결과와 Network·Accessibility 패널을 확인합니다.",
          },
          output: {
            value: "picture.sources=2\nvideo.controls=true; autoplay=false; preload=metadata\nvideo.tracks=1\naudio.controls=true; autoplay=false; preload=none",
            explanation: [
              "picture에는 조건별 source 두 개와 별도 img fallback이 있습니다.",
              "video/audio 모두 사용자가 시작하는 controls를 가지며 autoplay는 꺼져 있습니다.",
              "한국어 captions track 한 개와 외부 대본 링크가 시간 기반 콘텐츠의 대안을 이룹니다.",
            ],
          },
          experiments: [
            {
              change: "video에 autoplay를 추가하고 muted는 넣지 않습니다.",
              prediction: "많은 브라우저에서 소리 있는 자동 재생이 정책상 차단될 수 있습니다.",
              result: "속성이 존재한다고 실제 재생이 보장되지 않으며 사용자 시작 UI가 필요합니다.",
            },
            {
              change: "img의 loading='lazy'를 제거하고 fetchpriority='high'를 추가해 첫 화면 hero로 사용합니다.",
              prediction: "초기 핵심 이미지 요청 우선순위가 높아질 수 있지만 과도한 high 사용은 다른 자원을 지연시킵니다.",
              result: "LCP 후보 하나에 한정해 실제 성능 측정으로 결정해야 합니다.",
            },
          ],
          sourceRefs: ["web-media-source", "web-media-assets", "whatwg-images", "whatwg-media", "wai-audio-video"],
        },
      ],
      diagnostics: [
        {
          symptom: "video에 autoplay를 썼는데 자동 재생되지 않는다.",
          likelyCause: "브라우저의 사용자 참여·소리 있는 autoplay 정책에 의해 차단되었거나 OS 절전·데이터 절약 정책이 개입했습니다.",
          checks: [
            "play() Promise rejection과 브라우저 console을 확인합니다.",
            "muted 상태와 사용자 gesture 이후 재생을 비교합니다.",
            "실제 요구가 자동 재생이어야 하는지 접근성·데이터 비용을 재검토합니다.",
          ],
          fix: "사용자가 명시적으로 재생하는 controls를 기본으로 하고 꼭 필요한 장식 영상만 muted·playsinline 정책을 신중히 사용합니다.",
          prevention: "autoplay 성공을 기능 전제로 삼지 않고 차단 상태에서도 poster·텍스트·조작이 남는지 테스트합니다.",
        },
        {
          symptom: "자막 메뉴가 없거나 track이 로드되지 않는다.",
          likelyCause: "VTT 문법, kind·srclang·label, 파일 경로, MIME, CORS 중 하나가 잘못됐습니다.",
          checks: [
            "Network에서 VTT 상태·text/vtt content-type을 확인합니다.",
            "파일 첫 줄 WEBVTT와 cue 시간 형식을 검증합니다.",
            "track element가 video의 자식이고 kind='captions'인지 확인합니다.",
          ],
          fix: "유효한 UTF-8 WebVTT를 올바른 경로·MIME으로 제공하고 언어·label을 명시합니다.",
          prevention: "대표 브라우저·키보드·screen reader 조합에서 captions 선택과 동기화를 QA합니다.",
        },
      ],
    },
    {
      id: "iframe-object-security",
      title: "iframe은 독립 문서를 삽입하므로 최소 권한과 명확한 제목이 필요합니다",
      lead: "iframe은 단순 사각형 미디어가 아니라 별도 browsing context이므로 접근 가능한 이름·실행 권한·referrer·삽입 가능 정책을 함께 다룹니다.",
      explanations: [
        "원본은 내부 HTML 문서, name을 가진 문서 target, YouTube embed를 iframe으로 넣습니다. iframe title은 주변 heading과 별개로 frame 안 콘텐츠의 목적을 보조기기에 알려 줍니다. 'iframe'이나 '영상'보다 'HTML 표 예제 미리보기', '반응형 이미지 강의 영상'처럼 구체적으로 씁니다.",
        "sandbox를 값 없이 두면 script, form 제출, top navigation, same-origin 권한 등을 강하게 제한합니다. 필요한 token만 하나씩 허용합니다. allow-scripts와 allow-same-origin을 같은 origin의 신뢰할 수 없는 콘텐츠에 함께 주면 sandbox 약화 가능성을 검토해야 합니다. allow 속성도 autoplay, camera, microphone 등 필요한 기능만 허용합니다.",
        "referrerpolicy는 외부 frame 요청에 현재 페이지 URL 정보가 얼마나 전달되는지 제어합니다. 개인정보·경로 token이 URL에 들어가지 않는 것이 우선이며, 외부 삽입에는 strict-origin-when-cross-origin 또는 더 엄격한 no-referrer를 검토합니다. loading='lazy'는 화면 밖 frame의 네트워크·script 비용을 늦춥니다.",
        "상대 사이트는 X-Frame-Options 또는 CSP frame-ancestors로 삽입을 거부할 수 있습니다. 빈 frame이 보인다고 src 경로만 의심하지 말고 response header와 console을 확인합니다. 이를 우회하려고 proxy로 보안 정책을 제거하지 않습니다.",
        "object는 PDF·미디어·플러그인형 자원을 일반적으로 삽입할 수 있지만 native img/audio/video나 iframe보다 목적·접근성·보안 계약이 모호해질 수 있습니다. PDF는 다운로드·새 문서 링크를 함께 제공하고, audio/video는 native 요소를 우선합니다.",
        "외부 iframe은 상대 사업자의 cookie·tracking·script를 로드할 수 있습니다. click-to-load placeholder, privacy-enhanced embed domain, consent, CSP frame-src allowlist를 제품 정책으로 검토합니다.",
      ],
      concepts: [
        {
          term: "browsing context",
          definition: "문서를 탐색·표시하고 자체 window·history·script 환경을 갖는 독립 실행 문맥입니다.",
          detail: [
            "iframe 하나가 중첩 browsing context를 만듭니다.",
            "부모와의 접근은 origin·sandbox·정책에 의해 제한됩니다.",
          ],
        },
        {
          term: "sandbox",
          definition: "iframe 안 문서의 script·form·navigation·origin 등 기능을 기본 제한하고 명시 token만 완화하는 속성입니다.",
          detail: [
            "값 없는 sandbox가 가장 제한적입니다.",
            "필요한 권한만 허용하는 최소 권한 원칙을 적용합니다.",
          ],
        },
        {
          term: "Permissions Policy",
          definition: "iframe 등 문맥에 camera·microphone·autoplay 같은 기능 사용 권한을 제한하는 정책입니다.",
          detail: [
            "iframe allow 속성과 HTTP header로 제어할 수 있습니다.",
            "기능이 필요하다는 이유와 사용자 동의를 별도로 설계합니다.",
          ],
        },
      ],
      codeExamples: [
        {
          id: "sandboxed-srcdoc-frame",
          title: "title과 빈 sandbox를 가진 자체 포함 iframe",
          language: "html",
          filename: "safe_iframe.html",
          purpose: "외부 네트워크 없이 srcdoc 독립 문서를 삽입하고 iframe의 접근 가능한 이름·sandbox·referrer·lazy 계약을 정확히 검증합니다.",
          code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>안전한 iframe 기본값</title>\n  <style>iframe { width: 100%; max-width: 640px; height: 180px; border: 1px solid #999; }</style>\n</head>\n<body>\n  <h1>삽입 문서 미리보기</h1>\n  <iframe id=\"preview\"\n          title=\"HTML 표 예제 미리보기\"\n          srcdoc=\"<!doctype html><html lang='ko'><body><h2>표 예제</h2><p>독립 문서 내용입니다.</p></body></html>\"\n          sandbox\n          loading=\"lazy\"\n          referrerpolicy=\"no-referrer\"></iframe>\n\n  <p><a href=\"table-example.html\">미리보기를 새 문서로 열기</a></p>\n  <h2>검증 결과</h2>\n  <pre id=\"check\"></pre>\n  <script>\n    const frame = document.querySelector('#preview');\n    document.querySelector('#check').textContent = [\n      'iframe.title=' + JSON.stringify(frame.title),\n      'iframe.sandbox=' + frame.hasAttribute('sandbox') + '; tokens=' + frame.sandbox.length,\n      'iframe.loading=' + frame.loading,\n      'iframe.referrerPolicy=' + frame.referrerPolicy,\n      'iframe.allow=' + (frame.getAttribute('allow') || '(none)')\n    ].join('\\n');\n  </script>\n</body>\n</html>",
          walkthrough: [
            {
              lines: "10-15",
              explanation: "title은 frame 목적을 설명하고 srcdoc은 별도 독립 HTML 문서를 만듭니다. 실제 외부 src를 쓸 때도 title 계약은 같습니다.",
            },
            {
              lines: "13",
              explanation: "값 없는 sandbox는 허용 token 0개인 강한 제한 기본값입니다. 기능 요구가 생길 때만 token을 검토합니다.",
            },
            {
              lines: "14-15",
              explanation: "화면 밖 로드를 늦추고 referrer를 보내지 않도록 힌트·정책을 설정합니다.",
            },
            {
              lines: "17",
              explanation: "iframe이 로드되지 않거나 사용하기 어려운 경우를 위해 같은 목적의 일반 링크를 제공합니다.",
            },
            {
              lines: "21-29",
              explanation: "검증 스크립트가 title·sandbox 존재와 token 수·loading·referrer·allow 최소 권한을 페이지에 출력합니다.",
            },
          ],
          run: {
            environment: ["최신 브라우저", "UTF-8로 저장한 safe_iframe.html", "외부 자원 없음"],
            command: "python -m http.server 8000",
            input: "브라우저에서 http://localhost:8000/safe_iframe.html을 엽니다.",
          },
          output: {
            value: "iframe.title=\"HTML 표 예제 미리보기\"\niframe.sandbox=true; tokens=0\niframe.loading=lazy\niframe.referrerPolicy=no-referrer\niframe.allow=(none)",
            explanation: [
              "frame에는 구체적인 접근 가능한 제목이 있습니다.",
              "sandbox는 존재하지만 완화 token이 없어 기본 최소 권한입니다.",
              "카메라·마이크·autoplay 같은 allow 권한도 추가하지 않았습니다.",
            ],
          },
          experiments: [
            {
              change: "srcdoc 안에 script로 부모 document를 수정하는 코드를 추가합니다.",
              prediction: "빈 sandbox에서는 script 자체가 실행되지 않습니다.",
              result: "필요하지 않은 script 권한을 기본 차단하는 효과를 확인합니다.",
            },
            {
              change: "sandbox='allow-scripts'를 추가하고 srcdoc에서 script로 내부 문단만 바꿉니다.",
              prediction: "frame 내부 script는 실행되지만 고유 opaque origin 제한은 유지됩니다.",
              result: "권한 token 하나가 여는 기능과 남는 제한을 검토해야 합니다.",
            },
          ],
          sourceRefs: ["web-iframe-source", "whatwg-iframe"],
        },
      ],
      diagnostics: [
        {
          symptom: "iframe 영역이 비거나 브라우저 console에 refused to frame 메시지가 나온다.",
          likelyCause: "상대 서버의 X-Frame-Options 또는 CSP frame-ancestors가 현재 origin의 삽입을 금지합니다.",
          checks: [
            "iframe 문서 response header의 X-Frame-Options·Content-Security-Policy를 확인합니다.",
            "console의 정확한 frame 차단 이유와 origin을 확인합니다.",
            "src URL이 일반 탐색에서는 열리는지 비교합니다.",
          ],
          fix: "삽입 권한이 있는 공식 embed URL을 사용하거나 iframe 대신 일반 링크로 이동하게 합니다.",
          prevention: "외부 서비스 embed 계약을 문서화하고 실패 시 링크 fallback을 E2E 테스트합니다.",
        },
        {
          symptom: "screen reader에서 여러 iframe이 모두 '프레임'처럼만 발표되어 구분하기 어렵다.",
          likelyCause: "title이 없거나 '영상', 'iframe'처럼 목적을 구분하지 못하는 일반 제목을 사용했습니다.",
          checks: [
            "각 iframe의 title을 DOM·Accessibility tree에서 확인합니다.",
            "주변 heading만 읽지 않고 frame 목록에서 구분 가능한지 테스트합니다.",
          ],
          fix: "각 frame의 콘텐츠와 작업 목적을 간결하고 고유하게 설명하는 title을 제공합니다.",
          prevention: "iframe component API에서 title을 필수 prop으로 만들고 중복·빈 제목 접근성 테스트를 둡니다.",
        },
      ],
      expertNotes: [
        "CSP frame-src는 어떤 frame을 로드할지, frame-ancestors는 누가 현재 페이지를 frame에 넣을지를 제어합니다. 서로 다른 방향의 정책을 혼동하지 마세요.",
        "postMessage 통신에서는 event.origin과 message schema를 검증하고 '*' targetOrigin을 운영 데이터에 사용하지 않습니다.",
      ],
    },
    {
      id: "media-diagnostics-performance-testing",
      title: "정상 화면 하나가 아니라 실패·저속·키보드·보조기기 상태를 검사합니다",
      lead: "미디어는 네트워크·codec·정책·감각·권한에 따라 실패 방식이 많으므로 대표 happy path만 보고 완료할 수 없습니다.",
      explanations: [
        "이미지는 정상·404·느린 로드·alt 없음·alt 빈 값·200% 확대·고대비·좁은 화면을 검사합니다. Network를 throttling해 width/height 공간 예약이 실제로 layout shift를 막는지 보고, img.currentSrc와 naturalWidth를 기록해 반응형 후보 선택을 확인합니다.",
        "video/audio는 codec 후보별 성공, 모든 source 실패, captions on/off, keyboard controls, volume·pause, reduced motion, autoplay 차단, 대본 링크를 검사합니다. 미디어 duration·error code·readyState를 진단하되 사용자에게는 이해 가능한 오류와 대안을 제공합니다.",
        "iframe은 성공·frame-ancestors 차단·sandbox 기능 차단·offline·lazy loading·keyboard focus·고유 title·제3자 cookie 동의를 검사합니다. frame 안과 밖의 focus 이동이 보이고, 삽입이 없어도 일반 링크로 작업을 완료할 수 있어야 합니다.",
        "성능에서는 byte 크기만이 아니라 후보 선택, cache, decoding, LCP, CLS, main-thread script 비용을 함께 봅니다. 원본 자산 중 flower.mp4는 약 1.69MB, spring.mp3는 약 15.33MB이므로 한 페이지에서 autoplay/preload auto를 반복하면 초기 전송 비용이 커질 수 있습니다. 실제 encoding·duration별 최적화는 media metadata 도구로 별도 측정합니다.",
        "접근성 자동 검사는 alt 누락·iframe title 누락 같은 일부만 찾습니다. alt가 문맥에 맞는지, 자막이 정확한지, 대본이 동등한지, keyboard로 조작 가능한지는 사람이 콘텐츠와 함께 검토해야 합니다.",
      ],
      concepts: [
        {
          term: "currentSrc",
          definition: "브라우저가 src/srcset/picture 후보 중 실제 선택한 리소스 URL입니다.",
          detail: [
            "반응형 이미지 디버깅에서 img.currentSrc로 확인합니다.",
            "cache와 DPR을 통제하며 여러 viewport에서 측정합니다.",
          ],
        },
        {
          term: "미디어 오류 상태",
          definition: "네트워크·지원 형식·decode·정책 문제로 미디어가 정상 준비·재생되지 못한 상태입니다.",
          detail: [
            "HTMLMediaElement.error와 Network·console을 함께 봅니다.",
            "사용자에게 대본·다운로드·재시도·일반 링크를 제공합니다.",
          ],
        },
        {
          term: "progressive enhancement",
          definition: "기본 텍스트·링크·조작을 먼저 제공하고 지원되는 환경에서 이미지·미디어·embed 경험을 더하는 전략입니다.",
          detail: [
            "리소스 실패와 제한된 장치에서도 핵심 작업이 남습니다.",
            "fallback은 오래된 브라우저 문구 하나가 아니라 실제 대체 경로 전체입니다.",
          ],
        },
      ],
      codeExamples: [],
      diagnostics: [
        {
          symptom: "개발 환경에서는 미디어가 재생되지만 배포 후 seek가 안 되거나 일부 브라우저에서 로드 실패한다.",
          likelyCause: "서버 MIME·byte range·CORS·codec profile·캐시 설정이 로컬 파일 실행과 다릅니다.",
          checks: [
            "Network response의 status, content-type, accept-ranges, CORS header를 확인합니다.",
            "브라우저별 canPlayType과 실제 codec 정보를 확인합니다.",
            "CDN 변환·압축이 파일을 손상시키지 않았는지 비교합니다.",
          ],
          fix: "지원 codec 후보와 올바른 MIME·range 응답을 제공하고 배포 CDN에서 실제 재생·seek를 검증합니다.",
          prevention: "대표 browser/device matrix에서 source 선택·재생·seek·captions E2E를 수행합니다.",
        },
      ],
      expertNotes: [
        "사용자 업로드 미디어를 그대로 같은 origin에서 serving하지 마세요. MIME sniffing 방지, malware scan, transcoding, 크기·duration 제한, 격리 origin, Content-Disposition과 CSP를 설계합니다.",
        "외부 URL을 서버가 가져와 thumbnail을 만드는 기능은 SSRF 위험이 있습니다. scheme·DNS·redirect·사설망 차단과 byte/time limit가 필요합니다.",
      ],
    },
  ],
  lab: {
    title: "접근 가능한 강의 미디어 카드 제작",
    scenario: "한 학습 세션 카드에 cover 이미지, 선택형 강의 영상, 한국어 자막·대본, 안전한 실습 미리보기 iframe을 넣고 느린 네트워크와 실패 상태에서도 학습 경로를 보존합니다.",
    setup: [
      "media-card 폴더에 index.html, images, media 폴더를 만듭니다.",
      "서로 다른 폭의 cover 후보와 16:9 poster를 준비하고 실제 pixel width·height를 기록합니다.",
      "MP4·WebM 중 제공 가능한 형식과 UTF-8 WebVTT 자막, HTML 대본을 준비합니다.",
      "python -m http.server 8000으로 file URL이 아닌 HTTP에서 테스트합니다.",
    ],
    steps: [
      "cover가 정보 이미지인지 장식인지 문장으로 결정하고 정보 이미지라면 문맥형 alt를 작성합니다.",
      "img에 고유 width·height, max-width:100%, height:auto를 적용하고 srcset·sizes 후보를 구성합니다.",
      "장식 accent는 CSS background로 분리하고 콘텐츠 텍스트를 배경에 굽지 않습니다.",
      "video에 controls, preload=metadata, width·height, poster, source 후보를 넣되 autoplay는 사용하지 않습니다.",
      "한국어 captions track과 요소 밖 대본·다운로드 링크를 제공합니다.",
      "iframe 미리보기에 고유 title, 빈 sandbox부터 시작한 최소 token, loading=lazy, referrerpolicy를 적용합니다.",
      "iframe을 열 수 없을 때 같은 실습으로 이동하는 일반 링크를 제공합니다.",
      "원본처럼 float 텍스트 감싸기 버전을 만들고 flow-root로 container 높이를 보존합니다.",
      "같은 카드의 flex 버전을 만들어 좁은 화면·긴 제목·이미지 실패에서 비교합니다.",
      "DevTools에서 Network slow 3G와 cache disabled로 layout shift·currentSrc·media 요청 시점을 기록합니다.",
      "이미지 404, video source 모두 실패, VTT 404, iframe frame-ancestors 차단 상태를 각각 재현합니다.",
      "keyboard만으로 재생·대본·frame 대체 링크에 접근하고 screen reader의 img alt·iframe title을 확인합니다.",
    ],
    expectedResult: [
      "cover 로드 전후 카드의 텍스트·버튼 위치가 크게 이동하지 않습니다.",
      "이미지가 실패해도 alt·제목·학습 링크가 남고 장식 실패는 정보에 영향을 주지 않습니다.",
      "영상은 사용자 조작으로 시작하고 한국어 captions·대본·다운로드 경로를 제공합니다.",
      "iframe은 필요한 최소 기능만 가지며 차단되어도 일반 링크로 실습을 완료할 수 있습니다.",
      "좁은 화면에서 적절한 image 후보가 선택되고 currentSrc·전송 byte 근거가 기록됩니다.",
      "자동 검사 결과와 사람의 alt·자막·keyboard 검토 결과를 분리해 보고합니다.",
    ],
    cleanup: ["테스트 media에는 개인정보·저작권 불명 자료를 넣지 않고 제3자 iframe cookie를 개발 중에도 검토합니다."],
    extensions: [
      "AVIF·WebP 포맷 후보를 추가하고 decode·전송 크기·품질을 비교합니다.",
      "click-to-load 외부 영상 placeholder와 privacy-enhanced embed를 구현합니다.",
      "사용자 reduced-motion·save-data 선호에 따라 장식 영상과 고해상도 후보를 줄이는 정책을 설계합니다.",
    ],
  },
  exercises: [
    {
      difficulty: "따라하기",
      prompt: "원본 곰 이미지 예제를 접근 가능한 figure로 다시 작성하세요.",
      requirements: [
        "src 상대 경로를 문서 URL 기준으로 설명합니다.",
        "320×320 width·height와 반응형 CSS를 함께 사용합니다.",
        "주변 문맥에 맞는 alt와 figcaption을 각각 작성합니다.",
        "장식용 같은 파일 사례는 CSS background 또는 alt=''로 분리합니다.",
        "정상·깨진 src에서 화면과 접근 가능한 이름을 기록합니다.",
      ],
      hints: ["alt와 figcaption을 같은 문장으로 중복하지 마세요.", "HTML 크기 속성에는 px 문자열보다 정수 값을 사용하세요."],
      expectedOutcome: "콘텐츠·장식 역할, 크기 예약, 대체 텍스트를 하나의 figure에서 설명할 수 있습니다.",
      solutionOutline: ["이미지 목적을 문장으로 적습니다.", "img와 figcaption을 구성합니다.", "고유 크기·CSS를 적용하고 실패 상태를 테스트합니다."],
    },
    {
      difficulty: "응용",
      prompt: "강의 video를 다중 source·자막·대본과 함께 구성하세요.",
      requirements: [
        "최소 두 source에 올바른 type을 제공합니다.",
        "controls와 preload 정책을 설명하고 소리 있는 autoplay를 쓰지 않습니다.",
        "한국어 captions track과 별도 대본 링크를 제공합니다.",
        "poster·width·height로 공간을 예약합니다.",
        "모든 source와 track 실패 상태에서 사용자가 선택할 대안을 제공합니다.",
      ],
      hints: ["video 내부 fallback 문구만으로 현대 source 실패 UX가 해결된다고 가정하지 마세요.", "대본 링크는 video 요소 밖에 두세요."],
      expectedOutcome: "재생 가능성·사용자 제어·감각 접근성·실패 대안을 함께 갖춘 강의 영상이 완성됩니다.",
    },
    {
      difficulty: "설계",
      prompt: "제3자 실습 도구 iframe component의 보안·개인정보·접근성 계약을 설계하세요.",
      requirements: [
        "title을 필수 입력으로 만들고 중복·빈 제목을 거부합니다.",
        "sandbox token과 allow 권한을 기능별 최소 목록으로 문서화합니다.",
        "CSP frame-src allowlist, referrerpolicy, loading, consent/click-to-load를 포함합니다.",
        "frame-ancestors 차단·offline·timeout 시 일반 링크 fallback을 제공합니다.",
        "postMessage를 사용한다면 origin·schema·targetOrigin 검증을 설계합니다.",
        "keyboard focus 이동과 screen reader frame 목록 테스트를 포함합니다.",
        "제3자 cookie·tracking·보존 정책을 제품 문서에 연결합니다.",
      ],
      hints: ["sandbox='allow-scripts allow-same-origin' 조합을 무심코 기본값으로 만들지 마세요.", "삽입을 허용하는 상대 서비스의 공식 embed 계약을 확인하세요."],
      expectedOutcome: "iframe 한 줄을 최소 권한·실패 복구·동의·검증 가능한 component 계약으로 확장합니다.",
    },
  ],
  reviewQuestions: [
    {
      question: "같은 사진 파일을 img와 background-image 중 무엇으로 넣을지는 무엇이 결정하나요?",
      answer: "현재 문맥에서 사진이 정보·기능을 전달하는지, 제거해도 의미가 같은 순수 장식인지가 결정합니다. 콘텐츠면 img와 alt, 장식이면 CSS background가 자연스럽습니다.",
    },
    {
      question: "img에 width와 height를 둘 다 제공하면 반응형 CSS를 쓸 수 없나요?",
      answer: "아닙니다. 두 속성은 고유 비율 공간을 예약하고 CSS max-width:100%; height:auto로 비율을 유지하며 축소할 수 있습니다.",
    },
    {
      question: "title 속성이 alt를 대신하지 못하는 이유는 무엇인가요?",
      answer: "hover가 없는 장치와 보조기기에서 일관된 대체 텍스트가 아니며 이미지 실패 시 목적 보존 계약도 다르기 때문입니다.",
    },
    {
      question: "srcset과 picture의 대표적인 역할 차이는 무엇인가요?",
      answer: "srcset은 같은 구도의 해상도 후보를 제공하고 picture는 media·type에 따라 crop·구도 또는 포맷이 다른 art direction 후보를 제공할 수 있습니다.",
    },
    {
      question: "cover와 contain 중 어느 것이 항상 더 좋은가요?",
      answer: "항상 좋은 하나는 없습니다. cover는 box를 채우지만 crop하고, contain은 전체를 보이지만 빈 공간을 남깁니다. 이미지 역할과 box 요구로 선택합니다.",
    },
    {
      question: "왜 filter layout 대신 float를 전체 card grid에 쓰지 않나요?",
      answer: "float는 본래 주변 inline 콘텐츠 감싸기에 맞고 부모 높이·clear 문제가 있습니다. 1·2차원 component layout에는 flex/grid가 더 예측 가능합니다.",
    },
    {
      question: "video 요소 안 fallback 문구만 있으면 모든 source 실패를 처리한 것인가요?",
      answer: "아닙니다. 그 내용은 주로 video 요소 자체를 지원하지 않는 환경용입니다. 현대 source 실패에는 요소 밖 대본·다운로드 링크와 오류 UX가 필요합니다.",
    },
    {
      question: "autoplay muted가 브라우저에서 허용되면 접근성 문제도 해결되나요?",
      answer: "아닙니다. 소리는 없어도 motion·데이터·주의 분산 문제가 남고 사용자 정책에 따라 차단될 수 있습니다. 필요한 장식에 제한하고 제어·대안을 둡니다.",
    },
    {
      question: "iframe title과 주변 h2는 같은 역할인가요?",
      answer: "아닙니다. 주변 heading은 문서 구조를 만들고 iframe title은 frame 자체의 접근 가능한 이름으로 frame 목록과 탐색에서 목적을 구분합니다.",
    },
    {
      question: "외부 페이지가 일반 탭에서는 열리는데 iframe에서 거부되는 대표 원인은 무엇인가요?",
      answer: "상대 서버의 X-Frame-Options 또는 CSP frame-ancestors가 다른 origin의 삽입을 금지했기 때문일 수 있습니다.",
    },
  ],
  completionChecklist: [
    "콘텐츠 이미지와 장식을 문맥으로 구분해 img·background를 선택할 수 있다.",
    "alt decision을 정보·기능·장식·복잡 이미지로 나누어 작성할 수 있다.",
    "width·height와 aspect ratio가 layout shift를 줄이는 이유를 설명할 수 있다.",
    "srcset·sizes·picture와 currentSrc를 사용해 반응형 후보를 검증할 수 있다.",
    "float·clear·flow-root와 flex/grid의 선택 경계를 설명할 수 있다.",
    "cover·contain crop/빈 공간 trade-off를 여러 viewport에서 테스트할 수 있다.",
    "audio/video에 controls·source·preload·captions·대본·다운로드 대안을 제공할 수 있다.",
    "autoplay 차단과 source/VTT 실패를 진단할 수 있다.",
    "iframe에 고유 title과 최소 sandbox·allow·referrerpolicy를 설정할 수 있다.",
    "frame-ancestors 차단과 제3자 개인정보 영향을 포함한 fallback을 설계할 수 있다.",
  ],
  nextSessions: ["html-05-lists-navigation"],
  sources: [
    {
      id: "web-img-source",
      repository: "webstudy 학습 원본",
      path: "myweb/src/main/webapp/day02/ex03_image.html",
      usedFor: ["img", "src·alt·title", "width·height", "링크 이미지"],
      evidence: "원본의 곰 이미지 5개와 주석을 감사하고 실제 bear.jpg가 320×320 JPEG임을 확인했습니다. HTML 정수 크기·문맥형 alt·layout shift 설명으로 보강했습니다.",
    },
    {
      id: "web-float-source",
      repository: "webstudy 학습 원본",
      path: "myweb/src/main/webapp/day02/ex04_image_float.html",
      usedFor: ["float none·left·right", "텍스트 감싸기", "clear·현대 layout 비교"],
      evidence: "원본 500×600 img_girl.jpg를 width 100px로 배치한 세 흐름과 float 주석을 감사하고 flow-root·flex/grid 경계를 보강했습니다.",
    },
    {
      id: "web-background-source",
      repository: "webstudy 학습 원본",
      path: "myweb/src/main/webapp/day02/ex06_background_image.html",
      usedFor: ["background-image", "repeat", "cover·contain", "attachment"],
      evidence: "원본 body 배경의 no-repeat·contain·fixed와 cover/contain 주석을 감사하고 실제 kitten-1.jpg가 320×213임을 확인했습니다.",
    },
    {
      id: "web-media-source",
      repository: "webstudy 학습 원본",
      path: "myweb/src/main/webapp/day03/ex01_object.html",
      usedFor: ["object·embed 비교", "video·audio", "source 후보", "controls·autoplay·muted·loop"],
      evidence: "단일·다중 video source와 audio 두 예제를 감사했습니다. 실제 flower.mp4와 spring.mp3 존재·파일 크기를 확인하고 captions·대본·preload 공백을 보강했습니다.",
    },
    {
      id: "web-iframe-source",
      repository: "webstudy 학습 원본",
      path: "myweb/src/main/webapp/day03/ex02_iframe.html",
      usedFor: ["내부 문서 iframe", "name target", "YouTube embed", "autoplay·allowfullscreen"],
      evidence: "크기·border·name target·외부 영상 iframe을 감사하고 원본에 없는 title·sandbox·loading·referrerpolicy·권한 최소화를 보강했습니다.",
    },
    {
      id: "web-image-assets",
      repository: "webstudy 학습 자산",
      path: "myweb/src/main/webapp/images/{bear.jpg,img_girl.jpg,kitten-1.jpg}",
      usedFor: ["고유 pixel 크기", "aspect ratio", "원본 코드 실행 자산"],
      evidence: "이미지 metadata를 직접 읽어 bear 320×320, img_girl 500×600, kitten-1 320×213 RGB JPEG임을 확인했습니다.",
    },
    {
      id: "web-media-assets",
      repository: "webstudy 학습 자산",
      path: "myweb/src/main/webapp/medias/{flower.mp4,spring.mp3}",
      usedFor: ["원본 video·audio 존재", "전송 비용 관찰"],
      evidence: "원본 media 파일이 실제로 존재하며 flower.mp4는 1,686,685 bytes, spring.mp3는 15,332,033 bytes임을 확인했습니다. codec·duration은 추측하지 않았습니다.",
    },
    {
      id: "whatwg-images",
      repository: "WHATWG HTML Living Standard",
      path: "multipage/images.html",
      publicUrl: "https://html.spec.whatwg.org/multipage/images.html",
      usedFor: ["img·picture·source", "alt 요구", "srcset·sizes", "반응형 이미지"],
      evidence: "2026-07-12 기준 living standard의 이미지·반응형 후보·대체 텍스트 규약을 확인했습니다.",
    },
    {
      id: "whatwg-media",
      repository: "WHATWG HTML Living Standard",
      path: "multipage/media.html",
      publicUrl: "https://html.spec.whatwg.org/multipage/media.html",
      usedFor: ["audio·video", "source", "track", "controls·autoplay·preload"],
      evidence: "2026-07-12 기준 media element와 text track·재생 속성 규약을 확인했습니다.",
    },
    {
      id: "whatwg-iframe",
      repository: "WHATWG HTML Living Standard",
      path: "multipage/iframe-embed-object.html#the-iframe-element",
      publicUrl: "https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element",
      usedFor: ["iframe", "title", "sandbox", "loading", "referrerpolicy", "allow"],
      evidence: "2026-07-12 기준 iframe 속성·sandbox browsing context 규약을 확인했습니다.",
    },
    {
      id: "wai-images",
      repository: "W3C Web Accessibility Initiative",
      path: "tutorials/images",
      publicUrl: "https://www.w3.org/WAI/tutorials/images/",
      usedFor: ["정보·장식·기능·복잡 이미지 alt 의사결정", "텍스트 대안"],
      evidence: "W3C WAI Images Tutorial의 이미지 유형별 대체 텍스트 의사결정을 실습과 진단 기준으로 반영했습니다.",
    },
    {
      id: "wai-audio-video",
      repository: "W3C Web Accessibility Initiative",
      path: "media/av",
      publicUrl: "https://www.w3.org/WAI/media/av/",
      usedFor: ["captions", "transcript", "audio description", "media player 접근성"],
      evidence: "W3C WAI Audio and Video Media guidance를 자막·대본·오디오 설명·keyboard 조작 요구에 반영했습니다.",
    },
  ],
  sourceCoverage: {
    filesRead: 10,
    filesUsed: 10,
    uncoveredNotes: [
      "inventory sourceFiles의 5개 HTML과 실제 참조 자산 5개를 감사했습니다. image map 원본은 현재 원자 inventory에 포함되지 않아 별도 세션 범위로 남겼습니다.",
      "원본 img width에 px 문자열이 있으나 HTML width/height 속성의 표준 형식은 정수로 교정하고 CSS 표시 크기와 분리했습니다.",
      "원본 audio/video에는 captions·대본·preload 정책이 없고 iframe에는 title·sandbox·referrerpolicy가 없어 공식 표준·WAI 지침으로 보강했습니다.",
      "codec·duration과 실제 browser별 재생 성공은 metadata 도구·browser matrix가 필요한 후속 검증이며 파일 확장자만으로 추측하지 않았습니다.",
      "로컬 절대 경로와 비공개 백업 저장소 URL은 공개 데이터에 넣지 않고 일반화된 상대 source path와 공식 publicUrl만 사용했습니다.",
    ],
  },
} satisfies DetailedSession;

(session.chapters as DetailedSession["chapters"]).push(
  {
    id: "image-fetch-decode-layout-performance-contract",
    title: "이미지는 URL 하나가 아니라 선택·fetch·decode·layout·paint가 이어지는 성능 계약입니다",
    lead: "파일 크기만 줄여도 width·height가 없으면 layout shift가 생기고, 모든 image를 lazy로 만들면 첫 화면 LCP가 늦어질 수 있습니다. content 역할과 viewport 위치를 기준으로 속성과 측정 지표를 함께 정합니다.",
    explanations: [
      "width와 height content attributes는 원본 pixel 크기를 강제하는 단순 CSS가 아니라 intrinsic aspect ratio를 계산해 resource가 오기 전 공간을 예약하는 데 사용됩니다. responsive CSS로 `max-width:100%; height:auto`를 적용해도 올바른 비율 attribute를 유지하면 cumulative layout shift를 줄일 수 있습니다. 실제 표시 비율과 다른 값을 넣으면 왜곡·shift가 생깁니다.",
      "loading=lazy는 viewport 밖 non-critical image의 network·decode 비용을 미룰 수 있지만 hero/LCP image에 무조건 적용하면 가장 중요한 content가 늦어집니다. `fetchpriority=high/low`도 browser scheduler에 주는 hint일 뿐 보장이나 bandwidth 생성 도구가 아닙니다. preload·priority를 남발하면 서로 경쟁하므로 waterfall과 LCP attribution으로 결정합니다.",
      "decoding=async는 decode scheduling hint이며 decode 완료·paint 시점을 application에 보장하지 않습니다. 실제 decode가 필요한 script flow에서는 `HTMLImageElement.decode()` promise와 error fallback을 사용하되, network failure·unsupported format·memory pressure를 처리합니다. complete=true도 성공만 의미하지 않을 수 있으므로 naturalWidth와 error event를 함께 봅니다.",
      "responsive candidate 선택은 srcset descriptor, sizes, viewport, device pixel ratio, supported type와 browser cache 정책이 함께 결정합니다. `currentSrc`가 기대와 다르면 raw src만 보지 말고 picture/source media·type, sizes의 실제 slot width, Network initiator와 DPR을 기록합니다. screenshot만으로 전송 byte를 알 수 없습니다.",
    ],
    concepts: [
      { term: "intrinsic aspect ratio", definition: "media 자체 width와 height가 만드는 비율로, resource load 전후 layout 공간과 responsive sizing 계산에 사용됩니다.", detail: ["HTML width/height attribute로 사전 힌트를 제공할 수 있습니다.", "CSS rendered size와 원본 pixel 수는 별개입니다."] },
      { term: "decode", definition: "압축된 image bytes를 browser가 화면에 사용할 pixel representation으로 해석하는 단계입니다.", detail: ["network 완료와 별도 비용입니다.", "decode scheduling hint와 완료 promise를 구분합니다."] },
    ],
    codeExamples: [
      {
        id: "image-intrinsic-rendered-contract",
        title: "1×1 data image로 intrinsic·attribute·rendered dimensions와 load 상태 비교",
        language: "html",
        filename: "image-dimension-contract.html",
        purpose: "network 변동 없는 tiny image를 decode한 뒤 natural size, HTML dimension attributes, CSS rendered size와 loading hints를 exact output으로 기록합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>이미지 크기 계약</title>\n  <style>img { display: block; width: 160px; height: auto; }</style>\n</head>\n<body>\n  <main>\n    <h1>이미지 pipeline 점검</h1>\n    <img id=\"pixel\" src=\"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==\" alt=\"\" width=\"160\" height=\"90\" loading=\"eager\" decoding=\"async\" fetchpriority=\"low\">\n    <pre id=\"result\">decode 대기</pre>\n  </main>\n  <script>\n    const image = document.querySelector(\"#pixel\");\n    async function inspect() {\n      try { await image.decode(); } catch { /* error 상태도 아래에서 관찰 */ }\n      const rect = image.getBoundingClientRect();\n      const lines = [\n        `complete=${image.complete}`,\n        `natural=${image.naturalWidth}x${image.naturalHeight}`,\n        `attributes=${image.getAttribute(\"width\")}x${image.getAttribute(\"height\")}`,\n        `rendered=${Math.round(rect.width)}x${Math.round(rect.height)}`,\n        `loading=${image.loading}`,\n        `decoding=${image.decoding}`,\n        `fetchPriority=${image.fetchPriority}`,\n        `altLength=${image.alt.length}`,\n      ];\n      document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n    }\n    inspect();\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "CSS rendered width를 160px로 고정하고 height:auto로 intrinsic ratio를 사용하도록 준비합니다." },
          { lines: "8-13", explanation: "network가 필요 없는 1×1 transparent GIF에 decorative empty alt, 160×90 HTML dimension attributes와 명시적 loading/decode/priority hints를 둡니다." },
          { lines: "14-18", explanation: "image.decode를 기다리되 failure도 catch해 이후 complete·natural size 관찰이 반드시 실행되게 합니다." },
          { lines: "19-29", explanation: "natural, raw attribute, layout rect와 reflected hint·alt 값을 plain text로 기록합니다." },
          { lines: "30-34", explanation: "inspect를 호출하고 문서를 닫습니다. 비동기 결과가 `decode 대기`를 실제 값으로 교체합니다." },
        ],
        run: { environment: ["Chromium 계열 현대 browser", "JavaScript 활성화", "network 불필요"], command: "image-dimension-contract.html을 열고 #result가 decode 대기에서 여덟 줄로 바뀔 때까지 기다림" },
        output: { value: "complete=true\nnatural=1x1\nattributes=160x90\nrendered=160x160\nloading=eager\ndecoding=async\nfetchPriority=low\naltLength=0", explanation: ["resource intrinsic ratio는 1:1이라 CSS height:auto의 rendered box는 160×160입니다.", "HTML attributes 160×90은 실제 resource와 비율이 달라 load 전 예약 공간과 최종 layout 사이 shift 위험을 보여 줍니다.", "empty alt는 decorative image 계약이며 정보 image라면 목적을 전달하는 대체 text가 필요합니다."] },
        experiments: [
          { change: "height attribute를 160으로 고칩니다.", prediction: "attribute ratio와 decoded intrinsic ratio가 모두 1:1이 되어 예약 공간과 최종 box가 일치합니다.", result: "width/height는 asset pipeline이 실제 metadata에서 생성해야 합니다." },
          { change: "첫 화면 핵심 hero에 loading=lazy를 적용하고 Performance panel에서 LCP를 비교합니다.", prediction: "환경에 따라 fetch 시작이 늦어져 LCP가 악화될 수 있습니다.", result: "loading hint는 위치·우선순위별 실제 metric으로 결정합니다." },
        ],
        sourceRefs: ["web-img-source", "web-float-source", "web-image-assets", "whatwg-images", "wai-images"],
      },
    ],
    diagnostics: [
      { symptom: "페이지 처음 열 때 text가 아래로 밀리거나 hero가 늦게 나타나는데 모든 img에 lazy·low priority가 붙어 있다.", likelyCause: "실제 asset 비율과 다른 width/height 또는 LCP image까지 지연하는 일괄 loading policy를 사용했습니다.", checks: ["naturalWidth/Height와 attribute·rendered ratio를 비교합니다.", "Performance의 Layout Shift와 LCP attribution을 확인합니다.", "Network initiator·priority·currentSrc·transferred bytes를 봅니다."], fix: "asset metadata에서 정확한 dimension을 생성하고 above-the-fold 핵심 image는 eager/default 적정 priority로, offscreen image만 측정 근거에 따라 lazy 처리합니다.", prevention: "image manifest에 dimensions·format·byte budget을 두고 CLS/LCP·broken asset·candidate selection을 CI와 RUM에서 감시합니다." },
    ],
    comparisons: [{ title: "image loading priority를 어떻게 정할까요?", options: [
      { name: "eager/default", chooseWhen: "첫 화면 핵심 content나 곧 필요한 작은 image일 때", avoidWhen: "긴 page 아래 gallery 전체일 때", tradeoffs: ["필요 resource 발견·fetch가 빠릅니다.", "초기 bandwidth 경쟁이 커질 수 있습니다."] },
      { name: "lazy", chooseWhen: "viewport에서 멀고 없어도 초기 task가 가능한 image일 때", avoidWhen: "LCP hero·첫 card·layout 판단에 즉시 필요한 media일 때", tradeoffs: ["초기 transfer·decode를 줄입니다.", "scroll 접근 시 지연·placeholder 설계가 필요합니다."] },
      { name: "priority hint", chooseWhen: "waterfall evidence로 browser 기본 우선순위가 핵심 resource와 어긋날 때", avoidWhen: "모든 resource를 high로 표시하거나 측정 없이 최적화할 때", tradeoffs: ["scheduler 의도를 보완합니다.", "hint일 뿐이며 과용하면 구분 가치가 사라집니다."] },
    ] }],
    expertNotes: ["image CDN transformation URL에는 signed parameter·cache key·format negotiation이 얽힙니다. 원본 private asset URL과 user identifiers를 client log·markup에 노출하지 않고 signed URL 만료와 cache partition을 검토합니다.", "browser benchmark는 cold/warm cache, DPR, viewport, network/CPU throttling을 기록해야 재현됩니다. 한 번의 DevTools screenshot으로 성능 결론을 내리지 않습니다."],
  },
  {
    id: "media-state-captions-and-user-control",
    title: "audio·video는 파일 표시가 아니라 비동기 state machine과 사용자 제어·caption 계약입니다",
    lead: "controls가 보인다는 사실만으로 접근 가능한 media가 되지 않습니다. 대체 transcript, synchronized captions, keyboard control, autoplay 정책과 failure state를 content lifecycle 전체에서 관리합니다.",
    explanations: [
      "media element는 networkState·readyState·currentTime·paused·ended·error와 load metadata/canplay/play/pause/timeupdate/ended/error event를 가집니다. event 순서를 하나의 고정 happy path로 가정하지 말고 seeking, retry, source fallback, background tab과 slow network를 포함한 state transition을 검증합니다.",
      "controls attribute는 browser native UI를 제공하므로 custom player보다 keyboard·platform integration baseline이 강합니다. custom controls가 필요하면 native button, accessible names, focus order, slider semantics, elapsed/remaining time announcement와 fullscreen/captions state를 전부 구현하고 target browser·screen reader 조합에서 검증합니다.",
      "caption track은 대화뿐 아니라 이해에 필요한 비음성 소리를 synchronized text로 제공합니다. transcript는 검색·번역·빠른 탐색에 유용하지만 영상 속 동작·시각 정보가 핵심이면 audio description 또는 동등한 text 설명이 별도로 필요합니다. auto-generated caption은 사람 검수 전 정확성을 보장하지 않습니다.",
      "autoplay는 data·주의·소리와 접근성 문제 때문에 browser policy로 차단될 수 있고 muted 조건에서도 사용자를 놀라게 할 수 있습니다. explicit play를 baseline으로 두고 motion이 자동 시작되면 pause/stop/hide control과 reduced-motion/data preference를 고려합니다. play() promise rejection을 정상 분기로 처리합니다.",
    ],
    concepts: [
      { term: "media ready state", definition: "재생 위치에서 metadata·현재 frame·미래 data가 어느 정도 준비되었는지를 나타내는 단계적 상태입니다.", detail: ["network state와 다릅니다.", "buffering과 canplay 판단에 사용되지만 무한 재생 보장은 아닙니다."] },
      { term: "caption track", definition: "시간에 맞춰 대화와 중요한 소리 정보를 제공하는 synchronized text track입니다.", detail: ["언어와 label을 명확히 합니다.", "transcript·audio description과 목적이 다릅니다."] },
    ],
    codeExamples: [
      {
        id: "media-and-embed-contract-inspection",
        title: "network 요청 없이 video track과 iframe privacy attributes 검사",
        language: "html",
        filename: "media-embed-contract.html",
        purpose: "실제 media를 재생하지 않고도 controls·preload·playsinline·caption metadata와 iframe title·sandbox·referrer policy의 authoring contract를 DOM으로 확인합니다.",
        code: "<!doctype html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"utf-8\">\n  <title>미디어 계약 점검</title>\n</head>\n<body>\n  <main>\n    <h1>미디어와 embed 속성</h1>\n    <video id=\"lesson\" controls preload=\"metadata\" playsinline>\n      <track kind=\"captions\" srclang=\"ko\" label=\"한국어 자막\" default>\n      브라우저가 video를 지원하지 않습니다. <a href=\"transcript.html\">대본 읽기</a>\n    </video>\n    <iframe id=\"demo\" title=\"격리된 HTML 실행 결과\" loading=\"lazy\" referrerpolicy=\"no-referrer\" sandbox=\"allow-scripts\" srcdoc=\"<!doctype html><title>demo</title><p>격리 예제</p>\"></iframe>\n    <pre id=\"result\"></pre>\n  </main>\n  <script>\n    const video = document.querySelector(\"#lesson\");\n    const track = video.querySelector(\"track\");\n    const frame = document.querySelector(\"#demo\");\n    const lines = [\n      `controls=${video.controls}`,\n      `preload=${video.preload}`,\n      `playsInline=${video.playsInline}`,\n      `track=${track.kind}:${track.srclang}:${track.label}:${track.default}`,\n      `frameTitle=${frame.title}`,\n      `frameLoading=${frame.loading}`,\n      `framePolicy=${frame.referrerPolicy}`,\n      `frameSandbox=${frame.getAttribute(\"sandbox\")}`,\n    ];\n    document.querySelector(\"#result\").textContent = lines.join(\"\\n\");\n  </script>\n</body>\n</html>",
        walkthrough: [
          { lines: "1-7", explanation: "표준 문서와 독립 title·main을 준비합니다." },
          { lines: "8-16", explanation: "native controls video에 metadata preload·inline playback·한국어 default captions와 visible transcript fallback을 두고, iframe에는 고유 title·lazy·no-referrer·최소 sandbox token을 둡니다." },
          { lines: "17-20", explanation: "video, track, iframe element를 DOM에서 찾습니다." },
          { lines: "21-31", explanation: "boolean/reflected media properties와 track metadata, iframe privacy/security attributes를 exact string으로 기록합니다." },
          { lines: "32-34", explanation: "외부 resource fetch나 playback 없이 authoring contract만 검증하고 문서를 닫습니다." },
        ],
        run: { environment: ["Chromium 계열 현대 browser", "JavaScript 활성화", "network 불필요"], command: "media-embed-contract.html을 열고 #result와 Accessibility tree의 video/iframe 이름을 확인" },
        output: { value: "controls=true\npreload=metadata\nplaysInline=true\ntrack=captions:ko:한국어 자막:true\nframeTitle=격리된 HTML 실행 결과\nframeLoading=lazy\nframePolicy=no-referrer\nframeSandbox=allow-scripts", explanation: ["video는 native controls와 inline playback 계약을 DOM property로 반영합니다.", "track은 captions 종류·한국어·visible label·default 상태를 보존합니다.", "iframe은 사용자용 title과 referrer·sandbox 최소 권한을 독립 attribute로 가집니다."] },
        experiments: [
          { change: "iframe sandbox에 allow-same-origin을 추가합니다.", prediction: "embedded document의 origin capability가 커지고 allow-scripts 조합의 위험도 다시 평가해야 합니다.", result: "기능이 필요하다는 증거 없이 sandbox token을 늘리지 않습니다." },
          { change: "video의 controls를 제거합니다.", prediction: "custom control이 없으므로 keyboard·touch 사용자가 재생과 정지를 할 수 없습니다.", result: "native controls를 baseline으로 유지하거나 완전한 accessible custom player를 구현합니다." },
        ],
        sourceRefs: ["web-media-source", "web-iframe-source", "web-media-assets", "whatwg-media", "whatwg-iframe", "wai-audio-video"],
      },
    ],
    diagnostics: [
      { symptom: "video가 어떤 환경에서는 자동 재생되지 않고 custom play button도 focus·상태를 전달하지 못한다.", likelyCause: "autoplay 성공을 전제로 native controls를 제거하고 play() rejection·keyboard·caption state를 구현하지 않았습니다.", checks: ["play() promise rejection과 browser autoplay policy를 확인합니다.", "Tab/Space/Enter·screen reader에서 control name/state/order를 봅니다.", "caption·transcript·error fallback과 reduced-motion 조건을 점검합니다."], fix: "explicit user activation과 native controls를 baseline으로 복구하고 custom UI는 button/slider semantics·focus·state·caption control을 완전 구현합니다.", prevention: "slow network·blocked autoplay·missing source·keyboard·screen reader·caption 품질 matrix를 media release gate에 둡니다." },
    ],
    expertNotes: ["timeupdate를 매 frame UI rendering trigger로 사용하지 말고 animation frame 또는 적절한 throttling과 state ownership을 설계합니다. background tab과 seeking에서 event 빈도가 달라질 수 있습니다.", "caption·transcript에는 개인정보와 저작권 content가 포함될 수 있습니다. 저장·검색 indexing·번역 vendor 전송·retention과 access control을 media asset lifecycle에 포함합니다."],
  },
  {
    id: "embed-boundaries-fallback-and-observability",
    title: "iframe·object·third-party media는 별도 browsing context이자 공급망·privacy 경계입니다",
    lead: "embed가 화면에 보이는지는 첫 단계뿐입니다. origin, sandbox capability, permissions, referrer, CSP, consent, fallback과 장애 관측을 최소 권한으로 설계해야 합니다.",
    explanations: [
      "iframe은 부모와 독립 document와 navigation history를 가진 nested browsing context입니다. same-origin policy 때문에 cross-origin content의 DOM을 읽을 수 없으며, 협력이 필요하면 구체적인 targetOrigin과 schema validation을 갖춘 postMessage protocol을 사용합니다. `*` origin과 신뢰하지 않는 message data를 피합니다.",
      "sandbox는 token이 없는 가장 제한된 상태에서 필요한 capability만 추가합니다. allow-scripts, allow-forms, allow-popups, allow-same-origin은 서로 다른 위험을 열며 같은-origin content에 allow-scripts+allow-same-origin을 함께 주면 격리 기대가 약해질 수 있습니다. Permissions Policy와 CSP frame-src/frame-ancestors는 별도 방어입니다.",
      "third-party video·map은 초기 load부터 cookie·IP·referrer와 많은 script를 전송할 수 있습니다. click-to-load placeholder, privacy-enhanced endpoint, no-referrer, consent와 self-hosted poster/transcript를 검토합니다. 사용자가 거부해도 핵심 주소·대본·task가 남아야 합니다.",
      "object/embed fallback은 plugin-era legacy와 MIME handling risk가 있어 새 interactive content에는 iframe·native media·download link를 우선합니다. third-party 장애·CSP block·offline에서 blank rectangle이 되지 않도록 title, 설명, direct link, status message와 retry를 제공합니다.",
    ],
    concepts: [
      { term: "nested browsing context", definition: "iframe처럼 부모 document 안에 포함되지만 독립 document·window·navigation을 가지는 browsing 환경입니다.", detail: ["origin policy가 DOM 접근을 제한합니다.", "focus와 title을 부모 navigation과 함께 검토합니다."] },
      { term: "capability allowlist", definition: "embed가 실제 기능에 필요한 권한만 명시적으로 허용하고 나머지는 닫는 정책입니다.", detail: ["sandbox·Permissions Policy·CSP가 서로 다른 층을 담당합니다.", "token 조합의 상호작용을 test합니다."] },
    ],
    codeExamples: [],
    diagnostics: [
      { symptom: "third-party iframe이 차단되면 빈 영역만 남고 부모가 내부 DOM 오류를 읽으려다 SecurityError가 난다.", likelyCause: "cross-origin browsing context를 같은 DOM subtree로 가정하고 fallback·message protocol·observability를 설계하지 않았습니다.", checks: ["frame final origin·CSP·X-Frame-Options와 console을 확인합니다.", "title·direct link·placeholder·consent state를 봅니다.", "postMessage origin·schema와 sandbox/allow tokens를 감사합니다."], fix: "cross-origin DOM 직접 접근을 제거하고 최소 권한 postMessage 또는 server API를 사용하며 usable direct-link fallback을 제공합니다.", prevention: "provider outage·consent denied·CSP blocked·offline·keyboard focus·message spoof fixture를 integration test에 둡니다." },
    ],
    comparisons: [{ title: "외부 media를 어떻게 제공할까요?", options: [
      { name: "즉시 third-party iframe", chooseWhen: "사용자 동의·privacy·성능 비용이 정당화되고 핵심 기능이 embed 자체일 때", avoidWhen: "첫 방문부터 불필요한 tracking·large script를 유발할 때", tradeoffs: ["provider 기능을 빠르게 제공합니다.", "privacy·availability·performance를 외부에 의존합니다."] },
      { name: "click-to-load placeholder", chooseWhen: "사용자 선택 전 제3자 request를 미루고 poster·설명을 먼저 제공할 때", avoidWhen: "한 번의 추가 activation이 핵심 긴급 task를 막을 때", tradeoffs: ["초기 data·tracking을 줄이고 intent를 얻습니다.", "consent state와 fallback UX를 구현해야 합니다."] },
      { name: "self-hosted native media", chooseWhen: "asset 권리·delivery·caption·privacy를 직접 통제할 수 있을 때", avoidWhen: "encoding·CDN·streaming 운영 역량과 권리가 없을 때", tradeoffs: ["player·privacy·availability를 통제합니다.", "storage·transcoding·bandwidth·접근성 운영 책임이 커집니다."] },
    ] }],
    expertNotes: ["postMessage payload는 JSON처럼 보인다는 이유로 신뢰하지 않습니다. event.origin·event.source·versioned schema·capability를 검사하고 secret을 message나 URL에 넣지 않습니다.", "embed health telemetry는 provider URL의 민감 query와 사용자 content를 제거하고 load/error/timeout·consent category·fallback activation 정도만 최소 수집합니다."],
  },
);

(session.reviewQuestions as DetailedSession["reviewQuestions"]).push(
  { question: "img의 width와 height attribute를 CSS가 덮어쓰면 쓸모가 없나요?", answer: "아닙니다. resource load 전 intrinsic aspect ratio와 공간 예약에 사용되어 layout shift를 줄일 수 있습니다. 실제 asset 비율과 일치해야 합니다." },
  { question: "모든 image에 loading=lazy를 붙이면 항상 빨라지나요?", answer: "아닙니다. 첫 화면 LCP image의 fetch를 늦출 수 있어 viewport 위치와 waterfall·LCP 측정으로 선택해야 합니다." },
  { question: "image.complete가 true면 성공적으로 decode됐다는 뜻인가요?", answer: "항상 아닙니다. 실패·빈 source 경우도 고려해 naturalWidth, decode promise와 error event를 함께 확인합니다." },
  { question: "caption과 transcript는 같은 대체 수단인가요?", answer: "아닙니다. caption은 재생 시각에 동기화된 대화·소리 정보이고 transcript는 전체 text를 별도로 탐색·검색하게 합니다. 영상 정보에는 audio description도 필요할 수 있습니다." },
  { question: "iframe sandbox에 allow-scripts와 allow-same-origin을 넣으면 더 안전한가요?", answer: "자동으로 그렇지 않습니다. capability를 크게 열고 특히 same-origin content에서는 격리 기대를 약화할 수 있어 필요한 token만 허용해야 합니다." },
);

(session.completionChecklist as string[]).push(
  "natural·attribute·rendered dimensions와 aspect ratio를 비교해 CLS 원인을 진단할 수 있다.",
  "LCP image와 offscreen image에 eager/lazy·fetch priority를 서로 다르게 적용하고 waterfall로 검증할 수 있다.",
  "media ready/network state·play promise·caption·transcript·native controls를 failure path까지 설계할 수 있다.",
  "iframe title·sandbox·Permissions Policy·CSP·referrer와 postMessage origin/schema를 최소 권한으로 감사할 수 있다.",
  "third-party media가 차단·거부·offline이어도 poster·설명·direct link·대본으로 핵심 task를 유지할 수 있다.",
);

export default session;
