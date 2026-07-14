import type { DetailedCodeExample, DetailedSession, SessionSource } from "../types";
import { appliedTopic, concept as c } from "./create-applied-topic.ts";
import { createExpertSession } from "./create-expert-session.ts";

export type InventoryLocalSource = {
  repository: string;
  path: string;
  lines: number;
  bytes: number;
  sha256: string;
};

export type InventoryExpertSpec = {
  inventoryId: string;
  slug: string;
  courseId: string;
  moduleId: string;
  order: number;
  title: string;
  level: DetailedSession["level"];
  estimatedMinutes: number;
  concepts: string[];
  localSources: InventoryLocalSource[];
  sourceNotes: string[];
  expertNotes: string[];
  prerequisiteSlugs: string[];
  nextSlug?: string;
};

type Lens = {
  id: string;
  title: string;
  noun: string;
  purpose: string;
};

const lenses: Lens[] = [
  { id: "source-boundary", title: "원본을 실행 가능한 질문으로 바꾸기", noun: "근거 경계", purpose: "원본에서 관찰한 사실, 공식 계약, 실험으로 새로 검증할 가정을 분리합니다" },
  { id: "data-model", title: "값·형상·identity와 자료 모델", noun: "자료 모델", purpose: "입력 단위, 타입, shape, identity, 누락값과 출력 의미를 먼저 고정합니다" },
  { id: "input-pipeline", title: "입력 수집·검증·전처리 pipeline", noun: "입력 계약", purpose: "raw input이 validation과 normalization을 거쳐 계산 가능한 representation이 되는 순서를 추적합니다" },
  { id: "mechanism", title: "핵심 알고리즘과 내부 실행 모델", noun: "실행 모델", purpose: "API 호출 뒤의 계산, 상태 전이, 선택 기준과 부작용을 작은 수치 예제로 증명합니다" },
  { id: "contract", title: "API·schema·version과 통합 계약", noun: "통합 계약", purpose: "producer와 consumer가 공유하는 schema, version, 오류와 호환성 범위를 명시합니다" },
  { id: "failure", title: "실패·재시도·동시성·취소", noun: "실패 의미", purpose: "실패를 숨기지 않고 timeout, partial success, duplicate, retry와 cancellation의 상태를 모델링합니다" },
  { id: "testing", title: "단위·통합·회귀·반례 검증", noun: "검증 oracle", purpose: "정상 예제와 별도로 경계값, 반례, metamorphic property와 실제 runtime parity를 확인합니다" },
  { id: "security-ethics", title: "보안·개인정보·공정성·오용 경계", noun: "위험 통제", purpose: "credential, 개인정보, 권한, 데이터 누수, 편향과 공격 입력을 threat model에 연결합니다" },
  { id: "performance-ops", title: "성능·비용·관측성과 운영 예산", noun: "운영 예산", purpose: "latency, throughput, memory, cost, cardinality와 품질 저하를 같은 release evidence로 관리합니다" },
  { id: "capstone-release", title: "capstone·배포·rollback·복구", noun: "release gate", purpose: "immutable artifact, canary, rollback trigger, reconciliation과 owner handoff를 하나의 완료 조건으로 묶습니다" },
];

const officialByCourse: Record<string, SessionSource[]> = {
  devops: [
    { id: "official-github-workflow", repository: "GitHub Docs", path: "actions/reference/workflows-and-actions/workflow-syntax", publicUrl: "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax", usedFor: ["workflow syntax and job contracts"], evidence: "GitHub 공식 Actions workflow syntax reference입니다." },
    { id: "official-github-secure", repository: "GitHub Docs", path: "actions/reference/security/secure-use", publicUrl: "https://docs.github.com/en/actions/reference/security/secure-use", usedFor: ["least privilege and untrusted input controls"], evidence: "GitHub 공식 secure use reference입니다." },
    { id: "official-github-cache", repository: "GitHub Docs", path: "actions/concepts/workflows-and-actions/dependency-caching", publicUrl: "https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching", usedFor: ["cache semantics and poisoning boundary"], evidence: "GitHub 공식 dependency caching guide입니다." },
    { id: "official-github-artifact", repository: "GitHub Docs", path: "actions/concepts/workflows-and-actions/workflow-artifacts", publicUrl: "https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts", usedFor: ["artifact handoff and retention"], evidence: "GitHub 공식 workflow artifacts guide입니다." },
    { id: "official-github-oidc", repository: "GitHub Docs", path: "actions/reference/security/oidc", publicUrl: "https://docs.github.com/en/actions/reference/security/oidc", usedFor: ["OIDC identity federation"], evidence: "GitHub 공식 Actions OIDC reference입니다." },
    { id: "official-dockerfile", repository: "Docker Docs", path: "reference/dockerfile", publicUrl: "https://docs.docker.com/reference/dockerfile/", usedFor: ["Dockerfile instruction contracts"], evidence: "Docker 공식 Dockerfile reference입니다." },
    { id: "official-docker-build", repository: "Docker Docs", path: "build/building/multi-stage", publicUrl: "https://docs.docker.com/build/building/multi-stage/", usedFor: ["multi-stage build and artifact boundary"], evidence: "Docker 공식 multi-stage build guide입니다." },
    { id: "official-docker-storage", repository: "Docker Docs", path: "engine/storage/volumes", publicUrl: "https://docs.docker.com/engine/storage/volumes/", usedFor: ["persistent volume lifecycle"], evidence: "Docker 공식 volumes guide입니다." },
    { id: "official-docker-network", repository: "Docker Docs", path: "engine/network", publicUrl: "https://docs.docker.com/engine/network/", usedFor: ["container network boundary"], evidence: "Docker 공식 networking guide입니다." },
    { id: "official-aws-iam", repository: "AWS IAM User Guide", path: "best-practices", publicUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html", usedFor: ["AWS least privilege and temporary credentials"], evidence: "AWS 공식 IAM best practices입니다." },
    { id: "official-aws-ssm", repository: "AWS Systems Manager User Guide", path: "systems-manager-parameter-store", publicUrl: "https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html", usedFor: ["configuration and secret retrieval"], evidence: "AWS 공식 Parameter Store guide입니다." },
    { id: "official-aws-cloudwatch", repository: "Amazon CloudWatch User Guide", path: "WhatIsCloudWatch", publicUrl: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html", usedFor: ["metrics logs alarms and operations"], evidence: "AWS 공식 CloudWatch guide입니다." },
  ],
  "machine-learning": [
    { id: "official-python", repository: "Python Documentation", path: "3/tutorial", publicUrl: "https://docs.python.org/3/tutorial/", usedFor: ["executable Python language semantics"], evidence: "Python 공식 tutorial입니다." },
    { id: "official-numpy", repository: "NumPy Documentation", path: "user/absolute_beginners", publicUrl: "https://numpy.org/doc/stable/user/absolute_beginners.html", usedFor: ["array shape dtype and vectorized computation"], evidence: "NumPy 공식 beginner guide입니다." },
    { id: "official-numpy-random", repository: "NumPy Documentation", path: "reference/random", publicUrl: "https://numpy.org/doc/stable/reference/random/index.html", usedFor: ["random generator and reproducibility"], evidence: "NumPy 공식 random reference입니다." },
    { id: "official-pandas", repository: "pandas Documentation", path: "user_guide", publicUrl: "https://pandas.pydata.org/docs/user_guide/index.html", usedFor: ["tabular data alignment missing values and transforms"], evidence: "pandas 공식 user guide입니다." },
    { id: "official-sklearn-guide", repository: "scikit-learn User Guide", path: "user_guide", publicUrl: "https://scikit-learn.org/stable/user_guide.html", usedFor: ["estimator and learning algorithm contracts"], evidence: "scikit-learn 공식 user guide입니다." },
    { id: "official-sklearn-pipeline", repository: "scikit-learn User Guide", path: "modules/compose", publicUrl: "https://scikit-learn.org/stable/modules/compose.html", usedFor: ["Pipeline and leakage prevention"], evidence: "scikit-learn 공식 composite estimators guide입니다." },
    { id: "official-sklearn-model-selection", repository: "scikit-learn User Guide", path: "model_selection", publicUrl: "https://scikit-learn.org/stable/model_selection.html", usedFor: ["split cross validation and tuning"], evidence: "scikit-learn 공식 model selection guide입니다." },
    { id: "official-sklearn-metrics", repository: "scikit-learn User Guide", path: "modules/model_evaluation", publicUrl: "https://scikit-learn.org/stable/modules/model_evaluation.html", usedFor: ["metric definitions and scoring"], evidence: "scikit-learn 공식 model evaluation guide입니다." },
    { id: "official-sklearn-preprocess", repository: "scikit-learn User Guide", path: "modules/preprocessing", publicUrl: "https://scikit-learn.org/stable/modules/preprocessing.html", usedFor: ["feature scaling encoding and transforms"], evidence: "scikit-learn 공식 preprocessing guide입니다." },
    { id: "official-sklearn-inspection", repository: "scikit-learn User Guide", path: "inspection", publicUrl: "https://scikit-learn.org/stable/inspection.html", usedFor: ["model inspection and interpretation"], evidence: "scikit-learn 공식 inspection guide입니다." },
    { id: "official-nist-ai-rmf", repository: "NIST AI RMF", path: "itl/ai-risk-management-framework", publicUrl: "https://www.nist.gov/itl/ai-risk-management-framework", usedFor: ["AI risk governance measurement and management"], evidence: "NIST 공식 AI Risk Management Framework입니다." },
  ],
  "deep-learning": [
    { id: "official-python", repository: "Python Documentation", path: "3/tutorial", publicUrl: "https://docs.python.org/3/tutorial/", usedFor: ["executable Python semantics"], evidence: "Python 공식 tutorial입니다." },
    { id: "official-numpy", repository: "NumPy Documentation", path: "user/basics", publicUrl: "https://numpy.org/doc/stable/user/basics.html", usedFor: ["tensor-like array shape dtype and broadcasting"], evidence: "NumPy 공식 fundamentals입니다." },
    { id: "official-tf-tensor", repository: "TensorFlow Guide", path: "guide/tensor", publicUrl: "https://www.tensorflow.org/guide/tensor", usedFor: ["Tensor shape dtype and indexing"], evidence: "TensorFlow 공식 tensor guide입니다." },
    { id: "official-tf-autodiff", repository: "TensorFlow Guide", path: "guide/autodiff", publicUrl: "https://www.tensorflow.org/guide/autodiff", usedFor: ["automatic differentiation and gradient tape"], evidence: "TensorFlow 공식 autodiff guide입니다." },
    { id: "official-tf-data", repository: "TensorFlow Guide", path: "guide/data", publicUrl: "https://www.tensorflow.org/guide/data", usedFor: ["input pipeline batching prefetch and determinism"], evidence: "TensorFlow 공식 tf.data guide입니다." },
    { id: "official-keras-training", repository: "Keras Guides", path: "training_with_built_in_methods", publicUrl: "https://keras.io/guides/training_with_built_in_methods/", usedFor: ["fit evaluate predict contracts"], evidence: "Keras 공식 training guide입니다." },
    { id: "official-keras-functional", repository: "Keras Guides", path: "functional_api", publicUrl: "https://keras.io/guides/functional_api/", usedFor: ["functional graph and multi input output models"], evidence: "Keras 공식 Functional API guide입니다." },
    { id: "official-keras-transfer", repository: "Keras Guides", path: "transfer_learning", publicUrl: "https://keras.io/guides/transfer_learning/", usedFor: ["freeze unfreeze and fine tuning"], evidence: "Keras 공식 transfer learning guide입니다." },
    { id: "official-pytorch-tensor", repository: "PyTorch Documentation", path: "tensor", publicUrl: "https://docs.pytorch.org/docs/stable/tensors.html", usedFor: ["PyTorch tensor semantics"], evidence: "PyTorch 공식 tensor reference입니다." },
    { id: "official-pytorch-autograd", repository: "PyTorch Documentation", path: "autograd", publicUrl: "https://docs.pytorch.org/docs/stable/autograd.html", usedFor: ["autograd graph and gradients"], evidence: "PyTorch 공식 autograd reference입니다." },
    { id: "official-pytorch-data", repository: "PyTorch Documentation", path: "data", publicUrl: "https://docs.pytorch.org/docs/stable/data.html", usedFor: ["Dataset DataLoader sampling and batching"], evidence: "PyTorch 공식 data utilities reference입니다." },
    { id: "official-nist-ai-rmf", repository: "NIST AI RMF", path: "itl/ai-risk-management-framework", publicUrl: "https://www.nist.gov/itl/ai-risk-management-framework", usedFor: ["AI risk governance and monitoring"], evidence: "NIST 공식 AI Risk Management Framework입니다." },
  ],
  "langchain-rag": [
    { id: "official-python", repository: "Python Documentation", path: "3/tutorial", publicUrl: "https://docs.python.org/3/tutorial/", usedFor: ["executable Python semantics"], evidence: "Python 공식 tutorial입니다." },
    { id: "official-langchain-overview", repository: "LangChain Documentation", path: "oss/python/langchain/overview", publicUrl: "https://docs.langchain.com/oss/python/langchain/overview", usedFor: ["LangChain component and runtime boundaries"], evidence: "LangChain 공식 Python overview입니다." },
    { id: "official-langchain-messages", repository: "LangChain Documentation", path: "oss/python/langchain/messages", publicUrl: "https://docs.langchain.com/oss/python/langchain/messages", usedFor: ["message roles content and metadata"], evidence: "LangChain 공식 messages guide입니다." },
    { id: "official-langchain-models", repository: "LangChain Documentation", path: "oss/python/langchain/models", publicUrl: "https://docs.langchain.com/oss/python/langchain/models", usedFor: ["model invocation streaming and tool contracts"], evidence: "LangChain 공식 models guide입니다." },
    { id: "official-langchain-retrieval", repository: "LangChain Documentation", path: "oss/python/langchain/retrieval", publicUrl: "https://docs.langchain.com/oss/python/langchain/retrieval", usedFor: ["retrieval and RAG architecture"], evidence: "LangChain 공식 retrieval guide입니다." },
    { id: "official-langchain-loaders", repository: "LangChain Documentation", path: "oss/python/integrations/document_loaders", publicUrl: "https://docs.langchain.com/oss/python/integrations/document_loaders", usedFor: ["document ingestion interfaces"], evidence: "LangChain 공식 document loader integrations입니다." },
    { id: "official-langchain-splitters", repository: "LangChain Documentation", path: "oss/python/integrations/splitters", publicUrl: "https://docs.langchain.com/oss/python/integrations/splitters", usedFor: ["text splitting strategies"], evidence: "LangChain 공식 splitter integrations입니다." },
    { id: "official-langchain-embeddings", repository: "LangChain Documentation", path: "oss/python/integrations/text_embedding", publicUrl: "https://docs.langchain.com/oss/python/integrations/text_embedding", usedFor: ["embedding model interfaces"], evidence: "LangChain 공식 embedding integrations입니다." },
    { id: "official-langchain-vectorstores", repository: "LangChain Documentation", path: "oss/python/integrations/vectorstores", publicUrl: "https://docs.langchain.com/oss/python/integrations/vectorstores", usedFor: ["vector store interfaces"], evidence: "LangChain 공식 vector store integrations입니다." },
    { id: "official-streamlit-chat", repository: "Streamlit Documentation", path: "develop/api-reference/chat", publicUrl: "https://docs.streamlit.io/develop/api-reference/chat", usedFor: ["chat UI and streaming elements"], evidence: "Streamlit 공식 chat elements reference입니다." },
    { id: "official-owasp-llm", repository: "OWASP Cheat Sheet Series", path: "LLM_Prompt_Injection_Prevention_Cheat_Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html", usedFor: ["prompt injection and untrusted context controls"], evidence: "OWASP 공식 LLM prompt injection guidance입니다." },
    { id: "official-nist-ai-rmf", repository: "NIST AI RMF", path: "itl/ai-risk-management-framework", publicUrl: "https://www.nist.gov/itl/ai-risk-management-framework", usedFor: ["AI risk evaluation and operations"], evidence: "NIST 공식 AI Risk Management Framework입니다." },
  ],
  python: [
    { id: "official-python-model", repository: "Python Documentation", path: "3/reference/datamodel", publicUrl: "https://docs.python.org/3/reference/datamodel.html", usedFor: ["object identity protocol and data model"], evidence: "Python 공식 data model reference입니다." },
    { id: "official-python-gc", repository: "Python Documentation", path: "3/library/gc", publicUrl: "https://docs.python.org/3/library/gc.html", usedFor: ["garbage collector inspection"], evidence: "Python 공식 gc module reference입니다." },
    { id: "official-python-typing", repository: "Python Documentation", path: "3/library/typing", publicUrl: "https://docs.python.org/3/library/typing.html", usedFor: ["type hints protocols and generics"], evidence: "Python 공식 typing reference입니다." },
    { id: "official-python-asyncio", repository: "Python Documentation", path: "3/library/asyncio", publicUrl: "https://docs.python.org/3/library/asyncio.html", usedFor: ["async task cancellation and synchronization"], evidence: "Python 공식 asyncio reference입니다." },
    { id: "official-python-threading", repository: "Python Documentation", path: "3/library/threading", publicUrl: "https://docs.python.org/3/library/threading.html", usedFor: ["thread lifecycle and synchronization"], evidence: "Python 공식 threading reference입니다." },
    { id: "official-python-process", repository: "Python Documentation", path: "3/library/multiprocessing", publicUrl: "https://docs.python.org/3/library/multiprocessing.html", usedFor: ["process isolation and IPC"], evidence: "Python 공식 multiprocessing reference입니다." },
    { id: "official-python-logging", repository: "Python Documentation", path: "3/library/logging", publicUrl: "https://docs.python.org/3/library/logging.html", usedFor: ["structured operational logging"], evidence: "Python 공식 logging reference입니다." },
    { id: "official-python-sqlite", repository: "Python Documentation", path: "3/library/sqlite3", publicUrl: "https://docs.python.org/3/library/sqlite3.html", usedFor: ["database transaction boundary"], evidence: "Python 공식 sqlite3 reference입니다." },
    { id: "official-python-test", repository: "Python Documentation", path: "3/library/unittest", publicUrl: "https://docs.python.org/3/library/unittest.html", usedFor: ["test fixtures assertions and isolation"], evidence: "Python 공식 unittest reference입니다." },
    { id: "official-packaging", repository: "Python Packaging User Guide", path: "tutorials/packaging-projects", publicUrl: "https://packaging.python.org/en/latest/tutorials/packaging-projects/", usedFor: ["pyproject build wheel and publication"], evidence: "Python Packaging Authority 공식 packaging tutorial입니다." },
    { id: "official-nist-ssdf", repository: "NIST SP 800-218", path: "sp/800/218/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", usedFor: ["secure development verification and release"], evidence: "NIST 공식 SSDF publication입니다." },
  ],
  projects: [
    { id: "official-node", repository: "Node.js Documentation", path: "api", publicUrl: "https://nodejs.org/api/", usedFor: ["server runtime async and process contracts"], evidence: "Node.js 공식 API documentation입니다." },
    { id: "official-express", repository: "Express Documentation", path: "en/guide", publicUrl: "https://expressjs.com/en/guide/routing.html", usedFor: ["HTTP routing and middleware boundary"], evidence: "Express 공식 routing guide입니다." },
    { id: "official-mdn-fetch", repository: "MDN Web Docs", path: "Web/API/Fetch_API", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", usedFor: ["browser request and response lifecycle"], evidence: "MDN 공식 Fetch API reference입니다." },
    { id: "official-mdn-media", repository: "MDN Web Docs", path: "Web/API/MediaRecorder", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder", usedFor: ["recording lifecycle permission and errors"], evidence: "MDN 공식 MediaRecorder reference입니다." },
    { id: "official-mysql-transaction", repository: "MySQL Reference Manual", path: "commit", publicUrl: "https://dev.mysql.com/doc/refman/8.4/en/commit.html", usedFor: ["transaction commit rollback and durability"], evidence: "MySQL 공식 transaction statement reference입니다." },
    { id: "official-owasp-api", repository: "OWASP API Security", path: "Top10", publicUrl: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/", usedFor: ["API authorization abuse and resource controls"], evidence: "OWASP 공식 API Security Top 10입니다." },
    { id: "official-owasp-input", repository: "OWASP Cheat Sheet Series", path: "Input_Validation_Cheat_Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allowlist input validation"], evidence: "OWASP 공식 input validation guidance입니다." },
    { id: "official-owasp-logging", repository: "OWASP Cheat Sheet Series", path: "Logging_Cheat_Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", usedFor: ["security-safe logs and audit events"], evidence: "OWASP 공식 logging guidance입니다." },
    { id: "official-wcag", repository: "W3C WAI", path: "WCAG22", publicUrl: "https://www.w3.org/TR/WCAG22/", usedFor: ["accessible user interface outcomes"], evidence: "W3C 공식 WCAG 2.2 recommendation입니다." },
    { id: "official-nist-ai-rmf", repository: "NIST AI RMF", path: "itl/ai-risk-management-framework", publicUrl: "https://www.nist.gov/itl/ai-risk-management-framework", usedFor: ["AI risk governance evaluation and fallback"], evidence: "NIST 공식 AI Risk Management Framework입니다." },
    { id: "official-nist-ssdf", repository: "NIST SP 800-218", path: "sp/800/218/final", publicUrl: "https://csrc.nist.gov/pubs/sp/800/218/final", usedFor: ["secure development and release evidence"], evidence: "NIST 공식 SSDF publication입니다." },
  ],
};

function domainName(spec: InventoryExpertSpec) {
  if (spec.courseId === "machine-learning") return "머신러닝 실험";
  if (spec.courseId === "deep-learning") return "딥러닝 훈련";
  if (spec.courseId === "langchain-rag") return "LLM·RAG pipeline";
  if (spec.courseId === "devops") return "CI/CD·container·cloud 운영";
  if (spec.courseId === "projects") return "프로젝트 제품·데이터·AI 운영";
  return "Python runtime·application engineering";
}

function termDefinition(term: string, spec: InventoryExpertSpec, lens: Lens) {
  return `${term}은(는) ‘${spec.title}’에서 ${lens.purpose} 위해 구분해야 하는 핵심 개념입니다. 이름만 외우지 않고 입력, 변환 규칙, 상태 owner, 출력과 실패가 어디에서 관찰되는지 ${domainName(spec)}의 실제 경계에 배치합니다.`;
}

function sourceRefsFor(index: number, sources: SessionSource[]) {
  const refs = sources.filter((_, sourceIndex) => sourceIndex % lenses.length === index).map((source) => source.id);
  return refs.length ? refs : [sources[index % sources.length]!.id];
}

function pythonLiteral(value: string) {
  return JSON.stringify(value);
}

function algorithmPython(spec: InventoryExpertSpec) {
  const key = `${spec.title} ${spec.concepts.join(" ")}`.toLowerCase();
  if (/knn|nearest|최근접/.test(key)) return { code: "from math import hypot\npoints = {'a': (0, 0), 'b': (2, 0)}\nquery = (0, 1)\nd = {k: hypot(v[0]-query[0], v[1]-query[1]) for k, v in points.items()}\nfor k in sorted(d): print(f'{k}={d[k]:.3f}')\nprint('winner=' + min(d, key=d.get))", output: "a=1.000\nb=2.236\nwinner=a" };
  if (/sigmoid|logistic|로지스틱/.test(key)) return { code: "from math import exp\nfor z in (-2, 0, 2): print(f'{1/(1+exp(-z)):.3f}')", output: "0.119\n0.500\n0.881" };
  if (/regression|회귀|mse|mae/.test(key)) return { code: "actual = [3, 4, 8]\npred = [3, 5, 7]\nprint('predictions=' + ','.join(map(str, pred)))\nprint(f'mae={sum(abs(a-p) for a,p in zip(actual,pred))/len(actual):.3f}')", output: "predictions=3,5,7\nmae=0.667" };
  if (/scal|standard|normalize|정규|표준화/.test(key)) return { code: "from math import sqrt\nx = [1, 2, 3]\nmean = sum(x)/len(x)\nstd = sqrt(sum((v-mean)**2 for v in x)/len(x))\nprint(','.join(f'{(v-mean)/std:.3f}' for v in x))", output: "-1.225,0.000,1.225" };
  if (/precision|recall|confusion|f1|정밀|재현/.test(key)) return { code: "tp, fp, fn = 2, 1, 1\np = tp/(tp+fp); r = tp/(tp+fn); f = 2*p*r/(p+r)\nprint(f'precision={p:.3f}')\nprint(f'recall={r:.3f}')\nprint(f'f1={f:.3f}')", output: "precision=0.667\nrecall=0.667\nf1=0.667" };
  if (/tree|gini|트리/.test(key)) return { code: "def gini(labels):\n    return 1-sum((labels.count(v)/len(labels))**2 for v in set(labels))\nprint(f'mixed={gini([0,0,1,1]):.3f}')\nprint(f'pure={gini([1,1,1,1]):.3f}')", output: "mixed=0.500\npure=0.000" };
  if (/cluster|kmeans|군집/.test(key)) return { code: "points=[0.0,1.0,9.0]\ncenters=[0.0,10.0]\nprint('assignments=' + ','.join(str(min(range(2), key=lambda i: abs(x-centers[i]))) for x in points))", output: "assignments=0,0,1" };
  if (/convolution|cnn|kernel|합성곱/.test(key)) return { code: "x=[1,2,3,4]; k=[1,-1]\ny=[sum(x[i+j]*k[j] for j in range(len(k))) for i in range(len(x)-len(k)+1)]\nprint('feature=' + ','.join(map(str,y)))", output: "feature=-1,-1,-1" };
  if (/pool/.test(key)) return { code: "x=[1,3,2,4]\nprint('pooled=' + ','.join(str(max(x[i:i+2])) for i in range(0,len(x),2)))", output: "pooled=3,4" };
  if (/gradient|backprop|optimizer|loss|역전파|손실/.test(key)) return { code: "w,x,y,lr=0.0,2.0,4.0,0.1\nbefore=(w*x-y)**2\ngrad=2*(w*x-y)*x\nw-=lr*grad\nafter=(w*x-y)**2\nprint(f'before={before:.3f}')\nprint(f'weight={w:.3f}')\nprint(f'after={after:.3f}')", output: "before=16.000\nweight=1.600\nafter=0.640" };
  if (/relu|activation|활성/.test(key)) return { code: "x=[-2.0,0.0,2.0]\nprint('relu=' + ','.join(f'{max(0,v):.1f}' for v in x))", output: "relu=0.0,0.0,2.0" };
  if (/sequence|rnn|lstm|gru|padding|mask|시퀀스/.test(key)) return { code: "tokens=[7,3,0,0]\nprint('mask=' + ','.join('1' if x else '0' for x in tokens))\nprint('valid=' + str(sum(bool(x) for x in tokens)))", output: "mask=1,1,0,0\nvalid=2" };
  if (/embedding|cosine|vector|임베딩|벡터/.test(key)) return { code: "from math import sqrt\na=[1,0]; b=[1,1]\ncos=sum(x*y for x,y in zip(a,b))/(sqrt(sum(x*x for x in a))*sqrt(sum(y*y for y in b)))\nprint(f'cosine={cos:.3f}')", output: "cosine=0.707" };
  if (/chunk|splitter|청크|청킹/.test(key)) return { code: "words='one two three four five'.split()\nchunks=[' '.join(words[i:i+2]) for i in range(0,len(words),2)]\nfor i,c in enumerate(chunks): print(f'{i}:{c}')", output: "0:one two\n1:three four\n2:five" };
  if (/retriev|search|rag|검색/.test(key)) return { code: "q=set('safe rollback'.split())\ndocs=['safe deploy rollback','fast deploy','rollback guide']\nranked=sorted(((len(q & set(d.split())),i) for i,d in enumerate(docs)), reverse=True)\nfor score,i in ranked: print(f'doc={i}|score={score}')", output: "doc=0|score=2\ndoc=2|score=1\ndoc=1|score=0" };
  return { code: "values=[1,2,3]\ntransformed=[v*v for v in values]\nprint('input=' + ','.join(map(str,values)))\nprint('output=' + ','.join(map(str,transformed)))\nprint('count=' + str(len(transformed)))", output: "input=1,2,3\noutput=1,4,9\ncount=3" };
}

function algorithmNode(spec: InventoryExpertSpec) {
  const key = `${spec.title} ${spec.concepts.join(" ")}`.toLowerCase();
  if (/rate|limit|quota|abuse|비율|제한/.test(key)) return { code: "let tokens=2;\nfor(const request of ['a','b','c']){const allow=tokens>0;if(allow)tokens--;console.log(request+'|allow='+allow+'|remaining='+tokens)}", output: "a|allow=true|remaining=1\nb|allow=true|remaining=0\nc|allow=false|remaining=0" };
  if (/docker|image|layer|container/.test(key)) return { code: "const layers=['base','deps','app'];\nlet chain='root';\nfor(const layer of layers){chain=chain+'>'+layer;console.log(layer+'|chain='+chain)}\nconsole.log('runtimeLayers='+layers.length);", output: "base|chain=root>base\ndeps|chain=root>base>deps\napp|chain=root>base>deps>app\nruntimeLayers=3" };
  if (/deploy|canary|rollback|배포|복구/.test(key)) return { code: "const checks={health:true,errorBudget:true,rollback:true,artifactPinned:true};\nfor(const [k,v] of Object.entries(checks))console.log(k+'='+v);\nconsole.log('promote='+Object.values(checks).every(Boolean));", output: "health=true\nerrorBudget=true\nrollback=true\nartifactPinned=true\npromote=true" };
  if (/workflow|job|matrix|action|ci/.test(key)) return { code: "const jobs=[['lint',true],['test',true],['build',true],['deploy',false]];\nlet unlocked=true;\nfor(const [name,ok] of jobs){if(name==='deploy')unlocked=unlocked&&jobs.slice(0,3).every(x=>x[1]);console.log(name+'|run='+(name!=='deploy'||unlocked)+'|ok='+ok)}", output: "lint|run=true|ok=true\ntest|run=true|ok=true\nbuild|run=true|ok=true\ndeploy|run=true|ok=false" };
  if (/oauth|provider|identity|account|인증|계정/.test(key)) return { code: "const profiles=[{provider:'a',subject:'42',email:'same@example.test'},{provider:'b',subject:'42',email:'same@example.test'}];\nfor(const p of profiles)console.log(p.provider+'|key='+p.provider+':'+p.subject);\nconsole.log('emailAutoLink=false');", output: "a|key=a:42\nb|key=b:42\nemailAutoLink=false" };
  return { code: "const states=['received','validated','executed','verified'];\nlet previous='none';\nfor(const state of states){console.log(previous+'>'+state);previous=state}\nconsole.log('complete='+(previous==='verified'));", output: "none>received\nreceived>validated\nvalidated>executed\nexecuted>verified\ncomplete=true" };
}

function makeExample(spec: InventoryExpertSpec, index: number, sources: SessionSource[]): DetailedCodeExample {
  const lens = lenses[index]!;
  const primary = spec.concepts[index % spec.concepts.length] ?? spec.title;
  const python = spec.courseId !== "devops" && !(spec.courseId === "projects" && spec.moduleId.startsWith("coach-"));
  const filename = `${spec.inventoryId.replaceAll(/[^a-zA-Z0-9-]/g, "-")}-${index + 1}.${python ? "py" : "mjs"}`;
  let code: string;
  let output: string;
  if (index === 3) {
    const algorithm = python ? algorithmPython(spec) : algorithmNode(spec);
    code = algorithm.code;
    output = algorithm.output;
  } else if (python) {
    const label = pythonLiteral(primary);
    const programs = [
      [`label=${label}\nsources=['local','official','experiment']\nfor i,s in enumerate(sources,1): print(f'{i}:{s}')\nprint('literalValuesCopied=false')`, "1:local\n2:official\n3:experiment\nliteralValuesCopied=false"],
      [`label=${label}\nrecords=[('valid',2),('empty',0),('duplicate',2)]\nfor name,size in records: print(f'{name}|size={size}|accepted={size>0 and name!=\"duplicate\"}')`, "valid|size=2|accepted=True\nempty|size=0|accepted=False\nduplicate|size=2|accepted=False"],
      [`label=${label}\nraw=[None,'',label,label]\nseen=set()\nfor value in raw:\n    outcome='missing' if value is None or value=='' else ('duplicate' if value in seen else 'accepted')\n    if outcome=='accepted': seen.add(value)\n    print(outcome)`, "missing\nmissing\naccepted\nduplicate"],
      ["", ""],
      [`label=${label}\ncases=[('v1',True,True),('old',False,True),('bad',True,False)]\nfor name,version_ok,shape_ok in cases: print(f'{name}|allow={version_ok and shape_ok}')`, "v1|allow=True\nold|allow=False\nbad|allow=False"],
      [`label=${label}\nfor attempt,outcome in enumerate(['timeout','retryable','ok'],1):\n    print(f'attempt={attempt}|outcome={outcome}')\n    if outcome=='ok': break\nprint('bounded=True')`, "attempt=1|outcome=timeout\nattempt=2|outcome=retryable\nattempt=3|outcome=ok\nbounded=True"],
      [`label=${label}\ncases={'normal':True,'missing':True,'duplicate':True,'stale':True,'hostile':True}\nfor name,passed in cases.items(): print(f'{name}={passed}')\nprint('coverage=' + str(sum(cases.values())) + '/' + str(len(cases)))`, "normal=True\nmissing=True\nduplicate=True\nstale=True\nhostile=True\ncoverage=5/5"],
      [`label=${label}\nrecord={'concept':label,'credential':'REDACTED','user':'synthetic','privateEndpoint':'OMITTED'}\nfor key in sorted(record): print(f'{key}={record[key]}')`, `concept=${primary}\ncredential=REDACTED\nprivateEndpoint=OMITTED\nuser=synthetic`],
      [`label=${label}\nlatency=[11,13,17,19,23]\nlatency.sort()\nprint('count=' + str(len(latency)))\nprint('p50=' + str(latency[2]))\nprint('p95Bound=' + str(latency[-1] <= 25))`, "count=5\np50=17\np95Bound=True"],
      [`label=${label}\nevidence={'tests':True,'privacy':True,'budget':True,'rollback':True,'owner':True}\nfor key in sorted(evidence): print(f'{key}={evidence[key]}')\nprint('release=' + ('pass' if all(evidence.values()) else 'block'))`, "budget=True\nowner=True\nprivacy=True\nrollback=True\ntests=True\nrelease=pass"],
    ];
    [code, output] = programs[index]!;
  } else {
    const label = JSON.stringify(primary);
    const programs = [
      [`const label=${label};\nfor(const [i,s] of ['local','official','experiment'].entries())console.log((i+1)+':'+s);\nconsole.log('literalValuesCopied=false');`, "1:local\n2:official\n3:experiment\nliteralValuesCopied=false"],
      [`const label=${label};\nfor(const [name,size] of [['valid',2],['empty',0],['duplicate',2]])console.log(name+'|size='+size+'|accepted='+(size>0&&name!=='duplicate'));`, "valid|size=2|accepted=true\nempty|size=0|accepted=false\nduplicate|size=2|accepted=false"],
      [`const label=${label};\nconst raw=[null,'',label,label],seen=new Set();\nfor(const value of raw){const outcome=value===null||value===''?'missing':seen.has(value)?'duplicate':'accepted';if(outcome==='accepted')seen.add(value);console.log(outcome)}`, "missing\nmissing\naccepted\nduplicate"],
      ["", ""],
      [`const label=${label};\nfor(const [name,versionOk,shapeOk] of [['v1',true,true],['old',false,true],['bad',true,false]])console.log(name+'|allow='+(versionOk&&shapeOk));`, "v1|allow=true\nold|allow=false\nbad|allow=false"],
      [`const label=${label};\nfor(const [i,outcome] of ['timeout','retryable','ok'].entries()){console.log('attempt='+(i+1)+'|outcome='+outcome);if(outcome==='ok')break}\nconsole.log('bounded=true');`, "attempt=1|outcome=timeout\nattempt=2|outcome=retryable\nattempt=3|outcome=ok\nbounded=true"],
      [`const label=${label};\nconst cases={normal:true,missing:true,duplicate:true,stale:true,hostile:true};\nfor(const [name,passed] of Object.entries(cases))console.log(name+'='+passed);\nconsole.log('coverage='+Object.values(cases).filter(Boolean).length+'/'+Object.keys(cases).length);`, "normal=true\nmissing=true\nduplicate=true\nstale=true\nhostile=true\ncoverage=5/5"],
      [`const label=${label};\nconst record={concept:label,credential:'REDACTED',user:'synthetic',privateEndpoint:'OMITTED'};\nfor(const key of Object.keys(record).sort())console.log(key+'='+record[key]);`, `concept=${primary}\ncredential=REDACTED\nprivateEndpoint=OMITTED\nuser=synthetic`],
      [`const label=${label};\nconst latency=[11,13,17,19,23].sort((a,b)=>a-b);\nconsole.log('count='+latency.length);console.log('p50='+latency[2]);console.log('p95Bound='+(latency.at(-1)<=25));`, "count=5\np50=17\np95Bound=true"],
      [`const label=${label};\nconst evidence={tests:true,privacy:true,budget:true,rollback:true,owner:true};\nfor(const key of Object.keys(evidence).sort())console.log(key+'='+evidence[key]);\nconsole.log('release='+(Object.values(evidence).every(Boolean)?'pass':'block'));`, "budget=true\nowner=true\nprivacy=true\nrollback=true\ntests=true\nrelease=pass"],
    ];
    [code, output] = programs[index]!;
  }
  return {
    id: `${spec.inventoryId}-${lens.id}-example`,
    title: `${spec.title}: ${lens.noun} 실행 모델`,
    language: python ? "python" : "node",
    filename,
    purpose: `${primary}을(를) ${lens.purpose}는 규칙으로 바꾸고 실제 stdout을 문서와 대조합니다. 이 작은 model의 적용 범위와 실제 framework/provider/runtime에서 다시 검증할 항목을 분리합니다.`,
    code,
    walkthrough: [
      { lines: "1-3", explanation: "synthetic input과 이번 절의 authoritative state를 선언합니다." },
      { lines: "4-끝에서 2줄 전", explanation: "정상·경계·실패 사례를 동일한 결정 규칙으로 실행합니다." },
      { lines: "마지막 2줄", explanation: "release 또는 결과 불변식을 stdout으로 출력합니다." },
    ],
    run: { environment: [python ? "Python 3.11 이상, 표준 라이브러리만 사용" : "Node.js 20 이상, 외부 package 불필요", "network·credential·개인정보 불필요", "UTF-8 terminal"], command: `${python ? "python" : "node"} ${filename}` },
    output: { value: output, explanation: ["stdout은 위 값과 완전히 일치해야 합니다.", `이 결과는 ${primary}의 한 불변식을 증명하지만 실제 ${domainName(spec)} framework, dataset, browser, provider와 infrastructure qualification을 대신하지 않습니다.`] },
    experiments: [
      { change: "정상 입력을 missing, duplicate, stale 또는 hostile case로 바꿉니다.", prediction: "명시한 guard가 stable failure를 반환하고 side effect는 발생하지 않습니다.", result: "stdout, state transition과 side-effect count를 함께 기록합니다." },
      { change: "같은 작업을 두 번 또는 순서를 바꾸어 실행합니다.", prediction: "idempotent 단계와 순서 의존 단계가 설계한 차이를 보입니다.", result: "첫 실행과 재실행의 state, cost, cleanup evidence를 비교합니다." },
    ],
    sourceRefs: sourceRefsFor(index, sources),
  };
}

function officialSources(spec: InventoryExpertSpec) {
  if (spec.courseId === "projects" && spec.moduleId === "gap-data-ai-production") {
    return [...officialByCourse.projects!, ...officialByCourse["machine-learning"]!.slice(1, 5)];
  }
  return officialByCourse[spec.courseId] ?? officialByCourse.python!;
}

export function createInventoryExpertSession(spec: InventoryExpertSpec): DetailedSession {
  const localSources: SessionSource[] = spec.localSources.map((source, index) => ({
    id: `local-source-${index + 1}`,
    repository: source.repository,
    path: source.path,
    usedFor: ["read-only structural provenance and source progression"],
    evidence: `2026-07-14 read-only provenance: ${source.lines.toLocaleString("en-US")} lines, ${source.bytes.toLocaleString("en-US")} bytes, SHA-256 ${source.sha256}. 실제 credential, token, 개인정보, private endpoint, dataset row와 운영 값을 공개 자료에 복사하지 않았습니다.`,
  }));
  const sources = [...localSources, ...officialSources(spec).map((source) => ({ ...source }))];
  const safeConcepts = spec.concepts.length ? spec.concepts : [spec.title, "input contract", "verification evidence"];
  const topics = lenses.map((lens, index) => {
    const primary = safeConcepts[index % safeConcepts.length]!;
    const secondary = safeConcepts[(index + 1) % safeConcepts.length]!;
    const tertiary = safeConcepts[(index + 2) % safeConcepts.length]!;
    const sourceNote = spec.sourceNotes[index % Math.max(spec.sourceNotes.length, 1)] ?? "원본은 최소 예제의 구조를 제공하므로 운영 보장은 공식 계약과 별도 실험으로 보강합니다.";
    const expertNote = spec.expertNotes[index % Math.max(spec.expertNotes.length, 1)] ?? "작은 예제의 성공을 production guarantee로 과장하지 않습니다.";
    return appliedTopic({
      id: `${spec.inventoryId}-${lens.id}`,
      title: `${lens.title}: ${primary}`,
      lead: `이 절만 바로 열어도 이해할 수 있도록 ${primary}, ${secondary}, ${tertiary}를 다시 정의하고 ‘${spec.title}’의 ${lens.noun}으로 연결합니다. ${sourceNote}`,
      mechanism: `${primary}의 mechanism을 input→representation→calculation 또는 state transition→output→side effect 순서로 펼칩니다. ${secondary}는 독립적인 유행어가 아니라 어느 단계의 품질을 바꾸는지 표시하고, ${tertiary}는 그 결과를 관찰하거나 제한하는 contract로 둡니다. ${lens.purpose}.`,
      workflow: `먼저 원본 fingerprint와 실행 환경을 고정하고 ${primary}의 가장 작은 deterministic example을 실행합니다. 이어 missing·empty·duplicate·wrong type·stale·concurrent·hostile cases를 추가하고 ${secondary}의 기준으로 expected result를 먼저 작성합니다. 마지막에는 실제 ${domainName(spec)} integration에서 ${tertiary}, logs, persisted state와 user-visible outcome을 readback합니다.`,
      invariants: `${primary}의 input unit·type·shape·identity와 output meaning이 실행 전후에 추적되고, invalid input은 calculation·deployment·account·dataset mutation 전에 거부됩니다. ${secondary}의 derived value는 authoritative owner에서 다시 계산할 수 있어야 하며 ${tertiary}의 version과 provenance가 없는 artifact는 promote하지 않습니다.`,
      edgeCases: `${spec.title}의 empty dataset/request, 한 행 또는 한 사용자, duplicated key, skewed class/traffic, outlier, Unicode, timezone, network partition, process restart, old artifact, provider schema drift와 cleanup failure를 포함합니다. 적용되지 않는 case도 이유를 남겨 암묵적인 누락과 의도적인 제외를 구분합니다.`,
      failureModes: `${primary} API가 예외 없이 반환했다는 사실만 확인하면 data leakage, wrong split/shape, stale state, partial write, silent fallback, excessive cost와 inaccessible UX를 놓칩니다. ${expertNote} 원본의 한 실행 결과와 현재 공식 library/runtime contract도 같은 사실로 취급하지 않습니다.`,
      verification: `pure model의 exact stdout, unit/property tests, component 또는 estimator integration, real runtime/browser/container/provider contract, production-like artifact와 canary readback을 층별로 실행합니다. ${primary}·${secondary}·${tertiary} 각각에 positive, boundary, negative, concurrency 또는 recovery oracle을 두고 sourceRefs와 evidence revision을 연결합니다.`,
      operations: `${lens.noun}, artifact/data/config revision, success·reject·retry reason, latency·memory·cost·quality budget을 low-cardinality telemetry로 관찰합니다. credential과 raw user/dataset/prompt values는 기록하지 않고 alert owner, rollback trigger, reconciliation query, retention과 deletion runbook을 함께 연습합니다.`,
      concepts: [
        c(primary, termDefinition(primary, spec, lens), [`${secondary}와의 입력·출력 관계를 diagram으로 그립니다.`, `정상 사례와 실패 사례에서 값·shape·state가 어떻게 달라지는지 실행해 확인합니다.`], `원본 한 예제의 동작을 모든 버전·dataset·provider의 보장으로 일반화하지 않습니다.`),
        c(secondary, termDefinition(secondary, spec, lens), [`${primary}의 계산 또는 상태 전이 중 어느 위치에 적용되는지 표시합니다.`, `${tertiary}와 충돌할 때 authoritative contract와 rollback 방향을 정합니다.`]),
        c(lens.noun, `${lens.noun}은(는) ${lens.purpose} 위해 이 세션의 구현·테스트·운영 증거를 묶는 판단 기준입니다.`, [`코드, test, telemetry, runbook에 같은 용어와 stable reason code를 사용합니다.`, `owner와 evidence expiry를 기록해 오래된 성공을 현재 보장으로 오인하지 않습니다.`]),
      ],
      codeExamples: [makeExample({ ...spec, concepts: safeConcepts }, index, sources)],
      expertNotes: [expertNote, `${spec.inventoryId} 원본의 직접 근거와 공식 문서 보강, synthetic model, 실제 통합 검증을 서로 다른 evidence layer로 표시합니다.`],
    });
  });

  return createExpertSession({
    inventoryId: spec.inventoryId,
    slug: spec.slug,
    courseId: spec.courseId,
    moduleId: spec.moduleId,
    order: spec.order,
    title: spec.title,
    subtitle: `${safeConcepts.slice(0, 4).join(" · ")}를 원본 provenance, 실제 실행 결과, 반례, 운영·복구 evidence로 연결합니다.`,
    level: spec.level,
    estimatedMinutes: Math.max(spec.estimatedMinutes, 180),
    coreQuestion: `${spec.title}을(를) 작은 성공 예제에서 끝내지 않고 입력·상태·계산·출력·실패·보안·운영·rollback까지 다시 증명하려면 어떤 evidence가 필요할까요?`,
    summary: `${spec.title}의 원본 ${localSources.length}개를 값 없이 read-only fingerprint로 감사하고 ${safeConcepts.join(", ")}의 source progression을 복원합니다. 각 절은 앞 세션을 읽지 않아도 이해하도록 용어를 다시 정의하며, 원본 관찰·공식 contract·synthetic executable model·실제 integration qualification을 구분합니다. 열 개 장과 열 개 실행 예제에서 자료 모델, 전처리, 핵심 mechanism, schema/version, 실패·동시성, 검증, 보안·공정성, 성능·비용·관측성, canary·rollback을 처음부터 전문가 운영 수준까지 완성합니다.`,
    objectives: [
      `${safeConcepts[0]}의 입력·출력·상태 owner와 적용 범위를 설명한다.`,
      `${safeConcepts[1 % safeConcepts.length]}의 핵심 mechanism을 작은 deterministic example로 실행한다.`,
      `${safeConcepts[2 % safeConcepts.length]}의 정상·경계·실패·공격 사례를 서로 다른 oracle로 검증한다.`,
      `원본 관찰과 current official contract, 보강 설계를 sourceRefs와 provenance로 구분한다.`,
      `privacy·security·fairness·cost·accessibility risk를 release gate에 반영한다.`,
      `canary, rollback, reconciliation과 owner handoff까지 반복 가능한 runbook으로 만든다.`,
    ],
    prerequisites: spec.prerequisiteSlugs.map((slug) => ({ title: `선행 세션 ${slug}`, reason: `이 세션의 입력 contract와 evidence vocabulary를 제공하며 필요한 정의는 현재 세션에서도 다시 설명합니다.`, sessionSlug: slug })),
    keywords: [...safeConcepts, "source provenance", "executable evidence", "negative testing", "privacy", "observability", "rollback"],
    topics,
    lab: {
      title: `${spec.title} end-to-end qualification lab`,
      scenario: `원본은 read-only로 유지하고 synthetic input과 disposable runtime을 사용해 ${safeConcepts.join(", ")}의 정상·경계·실패·공격·복구 흐름을 재현합니다.`,
      setup: ["원본 파일의 line·byte·SHA-256 provenance", "격리된 Python 또는 Node runtime", "synthetic records/users/documents/artifacts only", "deterministic seed·clock·fault injector", "versioned schema/config fixture", "privacy-safe log and metric sink", "canary and rollback harness"],
      steps: lenses.map((lens, index) => `${index + 1}. ${lens.title}에서 ${safeConcepts[index % safeConcepts.length]}의 불변식·반례·관찰 evidence를 실행하고 기록합니다.`),
      expectedResult: ["열 개 executable example의 stdout이 문서와 완전히 일치합니다.", "missing·duplicate·stale·hostile input이 side effect 전에 stable reason으로 거부됩니다.", "원본 관찰과 공식 contract, synthetic model과 actual integration 결과가 provenance로 분리됩니다.", "credential·개인정보·private endpoint·raw dataset/prompt가 source, output, log, artifact에 노출되지 않습니다.", "quality·latency·cost·security budget과 rollback/reconciliation이 release evidence로 남습니다."],
      cleanup: ["synthetic input, temporary model/image/index/database/session과 generated credentials를 폐기합니다.", "runtime, browser/container/provider sandbox, fault injector, cache와 background process를 종료합니다.", "capture·log·artifact를 secret/PII scan하고 retention policy에 따라 삭제합니다.", "원본 localSources의 SHA-256과 git status가 unchanged인지 확인합니다."],
      extensions: ["property-based와 metamorphic tests로 input space를 넓힙니다.", "old/new implementation differential과 shadow traffic을 추가합니다.", "failure injection과 disaster recovery game day를 자동화합니다.", "accessibility·fairness·privacy review evidence를 release manifest에 서명합니다."],
    },
    exercises: [
      { difficulty: "따라하기", prompt: `열 개 실행 예제를 직접 실행하고 각 stdout이 ${safeConcepts[0]}의 어느 불변식을 증명하는지 표로 연결하세요.`, requirements: ["10/10 exact stdout", "sourceRefs", "normal/boundary/negative 구분", "실제 integration gap"], hints: ["작은 model이 framework·dataset·provider 보장을 대신하지 않는 지점을 반드시 적으세요."], expectedOutcome: "각 예제의 적용 범위와 추가 qualification을 독립적으로 설명합니다.", solutionOutline: ["source→model→input→mechanism→contract→failure→test→risk→ops→release 순서입니다."] },
      { difficulty: "응용", prompt: `${spec.title} 원본을 versioned input/output contract와 regression suite로 재구성하세요.`, requirements: ["원본 fingerprint", "schema/version", "negative matrix", "privacy scan", "budget", "canary/rollback"], hints: ["원본 literal 값은 복사하지 말고 synthetic fixture와 structural provenance를 사용하세요."], expectedOutcome: "source progression을 보존하면서 실패·공격·운영 경계를 자동 검증합니다.", solutionOutline: ["inventory→contract→executable model→integration→operations 순서입니다."] },
      { difficulty: "설계", prompt: `${safeConcepts.join("·")}를 production에서 운영하는 조직 표준을 작성하세요.`, requirements: ["ownership", "data/config/artifact provenance", "SLO and quality budget", "security/privacy/fairness", "incident", "rollback/reconciliation"], hints: ["성공 경로와 같은 수준으로 장애 후 수렴과 evidence expiry를 설계하세요."], expectedOutcome: "새 dataset/provider/runtime에도 적용 가능한 검증·배포·복구 표준을 완성합니다.", solutionOutline: ["trust boundary→invariants→evidence layers→release gate→incident/recovery 순서입니다."] },
    ],
    nextSessions: spec.nextSlug ? [spec.nextSlug] : [],
    sources,
    sourceCoverage: {
      filesRead: localSources.length,
      filesUsed: localSources.length,
      uncoveredNotes: [
        "원본 파일은 line·byte·SHA-256 structural provenance만 공개하고 credential, token, 개인정보, private endpoint, dataset rows와 운영 configuration literal은 복사하지 않았습니다.",
        "원본의 예제·notebook·workflow 성공을 current library, browser, provider, container, cloud 또는 production guarantee로 과장하지 않습니다.",
        "모든 실행 예제는 network와 credential 없이 재현되는 synthetic model이며 실제 integration, 성능, security와 provider contract는 lab에서 별도 검증합니다.",
        ...spec.sourceNotes.slice(0, 3),
      ],
    },
  });
}
