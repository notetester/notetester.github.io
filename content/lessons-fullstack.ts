import type { Lesson } from "./types";

export const fullstackLessons: Lesson[] = [
  {
    slug: "relational-sql-mysql-oracle",
    track: "backend",
    order: 1,
    title: "관계형 SQL: MySQL과 Oracle을 함께 읽는 법",
    eyebrow: "표를 설계하고 안전하게 묻기",
    summary:
      "행과 열, 기본키와 외래키에서 시작해 JOIN·집계·트랜잭션까지 연결하고, MySQL과 Oracle의 표현 차이도 함께 정리합니다.",
    level: "기초",
    duration: "45분",
    why:
      "Spring, MyBatis, JPA를 쓰더라도 마지막에는 데이터베이스가 SQL을 실행합니다. 표의 관계와 쿼리 결과를 직접 예측할 수 있어야 ORM이나 매퍼가 만든 오류도 정확히 고칠 수 있습니다.",
    prerequisites: [
      "문자열·숫자·날짜처럼 값의 자료형이 서로 다르다는 사실",
      "서버에 명령을 보내고 결과를 돌려받는 요청·응답의 기본 개념",
    ],
    keywords: ["RDBMS", "PRIMARY KEY", "FOREIGN KEY", "JOIN", "GROUP BY", "트랜잭션"],
    sections: [
      {
        id: "relation-and-keys",
        title: "관계형 데이터베이스는 표 사이의 약속이다",
        paragraphs: [
          "RDBMS(Relational Database Management System)는 데이터를 표(table)로 저장하고 표 사이의 관계를 키(key)로 표현하는 데이터베이스 관리 시스템입니다. 한 행(row)은 한 건의 기록, 한 열(column)은 그 기록의 한 속성을 뜻합니다.",
          "기본키(PRIMARY KEY)는 각 행을 유일하게 식별합니다. 외래키(FOREIGN KEY)는 다른 표의 기본키를 가리켜 ‘이 주문은 어느 회원의 것인가’ 같은 관계를 보장합니다. 아래처럼 회원과 주문을 분리하면 회원 이름을 주문마다 반복하지 않아도 됩니다. 이런 중복 감소 과정을 정규화라고 부릅니다.",
        ],
        bullets: [
          "NOT NULL: 값 누락을 금지합니다.",
          "UNIQUE: 같은 값을 두 번 저장하지 못하게 합니다.",
          "외래키: 존재하지 않는 부모 행을 참조하는 잘못된 데이터를 막습니다.",
        ],
        code: {
          language: "sql",
          label: "회원과 주문 표 만들기",
          code: `CREATE TABLE members (
  member_id BIGINT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL
);

CREATE TABLE orders (
  order_id BIGINT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  ordered_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_orders_member
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);`,
          explanation: [
            "DECIMAL은 금액처럼 오차가 없어야 하는 값을 저장할 때 부동소수점형보다 안전합니다.",
            "제약조건은 애플리케이션 코드가 실수해도 데이터베이스가 마지막 방어선을 맡게 합니다.",
          ],
        },
        result: {
          label: "스키마 생성 결과",
          output: `members: member_id로 회원 1명을 식별
orders: order_id로 주문 1건을 식별
orders.member_id -> members.member_id 관계 생성`,
          explanation: "orders에 없는 member_id를 넣으면 외래키 오류가 발생하므로 고아 주문이 생기지 않습니다.",
        },
        tip: "비밀번호는 예제 데이터라도 평문으로 저장하지 않습니다. 실제 서비스에서는 검증된 단방향 해시를 사용하세요.",
      },
      {
        id: "join-and-aggregate",
        title: "JOIN으로 관계를 펼치고 GROUP BY로 요약한다",
        paragraphs: [
          "JOIN은 나뉜 표를 조회 순간에 다시 연결합니다. INNER JOIN은 양쪽에 짝이 있는 행만, LEFT JOIN은 왼쪽 표의 모든 행과 짝이 있는 오른쪽 행을 돌려줍니다. 주문이 없는 회원도 보고 싶다면 members를 왼쪽에 둔 LEFT JOIN이 필요합니다.",
          "GROUP BY는 같은 기준값을 한 그룹으로 묶고 COUNT·SUM·AVG 같은 집계 함수를 적용합니다. WHERE는 그룹을 만들기 전에 행을 거르고, HAVING은 집계가 끝난 그룹을 거른다는 순서를 기억하세요.",
        ],
        code: {
          language: "sql",
          label: "회원별 주문 수와 합계",
          code: `SELECT
  m.member_id,
  m.name,
  COUNT(o.order_id) AS order_count,
  COALESCE(SUM(o.amount), 0) AS total_amount
FROM members m
LEFT JOIN orders o ON o.member_id = m.member_id
GROUP BY m.member_id, m.name
HAVING COALESCE(SUM(o.amount), 0) >= 50000
ORDER BY total_amount DESC;`,
          explanation: [
            "COUNT(o.order_id)는 NULL을 세지 않으므로 주문 없는 회원의 결과가 0입니다.",
            "COALESCE는 NULL을 0으로 바꿉니다. Oracle의 오래된 코드에서는 NVL을 볼 수도 있습니다.",
          ],
        },
        result: {
          label: "예상 조회 결과",
          output: `member_id | name   | order_count | total_amount
1         | 민준   | 2           | 78000.00
4         | 서연   | 1           | 52000.00`,
          explanation: "합계가 5만 원보다 작은 그룹은 HAVING 단계에서 제외됩니다.",
        },
      },
      {
        id: "transaction",
        title: "트랜잭션은 여러 SQL을 하나의 일로 묶는다",
        paragraphs: [
          "트랜잭션(transaction)은 ‘전부 성공하거나 전부 취소되어야 하는’ 작업 단위입니다. 주문 생성과 재고 감소 중 하나만 반영되면 데이터가 모순되므로 같은 트랜잭션으로 묶어야 합니다.",
          "COMMIT은 현재 변경을 확정하고 ROLLBACK은 확정 전 변경을 취소합니다. 동시에 여러 요청이 같은 행을 바꿀 때는 격리 수준과 잠금도 중요하지만, 처음에는 트랜잭션 범위를 짧게 유지하고 외부 API 호출을 그 안에 오래 두지 않는 습관부터 익히세요.",
        ],
        code: {
          language: "sql",
          label: "주문과 재고를 함께 처리",
          code: `START TRANSACTION;

UPDATE products
SET stock = stock - 1
WHERE product_id = 10 AND stock > 0;

INSERT INTO orders(order_id, member_id, amount, ordered_at)
VALUES (101, 1, 39000, CURRENT_TIMESTAMP);

COMMIT;
-- 중간에 오류가 나면 COMMIT 대신 ROLLBACK;`,
          explanation: [
            "UPDATE 영향 행 수가 0이면 품절일 수 있으므로 INSERT 전에 확인해야 합니다.",
            "MySQL의 START TRANSACTION은 Oracle에서는 보통 첫 DML부터 트랜잭션이 시작되는 방식으로 다뤄집니다.",
          ],
        },
        result: {
          label: "성공과 실패의 차이",
          output: `성공: stock 8 -> 7, 주문 101 생성
실패 후 ROLLBACK: stock 8 유지, 주문 101 없음`,
        },
      },
      {
        id: "mysql-vs-oracle",
        title: "같은 SQL 개념, 다른 방언을 구분한다",
        paragraphs: [
          "MySQL과 Oracle은 표·키·JOIN·트랜잭션이라는 관계형 원리는 같습니다. 다만 자동 번호, 문자열 결합, 페이징, NULL 처리처럼 제품별 문법이 다릅니다. 이를 SQL 방언(dialect) 차이라고 합니다.",
          "최신 Oracle은 표준적인 FETCH FIRST를 지원하지만 오래된 자료에는 ROWNUM이 자주 나옵니다. MySQL의 AUTO_INCREMENT에 대응하는 Oracle 방식으로는 IDENTITY 또는 SEQUENCE가 있습니다. 코드를 옮길 때 단순 치환보다 사용 중인 데이터베이스 버전을 먼저 확인하세요.",
        ],
        code: {
          language: "sql",
          label: "페이징과 NULL 처리 비교",
          code: `-- MySQL
SELECT COALESCE(nickname, name) AS display_name
FROM members
ORDER BY member_id
LIMIT 10 OFFSET 20;

-- Oracle 12c+
SELECT COALESCE(nickname, name) AS display_name
FROM members
ORDER BY member_id
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;`,
          explanation: [
            "COALESCE는 두 제품에서 모두 사용할 수 있는 표준 SQL 함수라 이식성이 좋습니다.",
            "ORDER BY 없이 페이징하면 같은 페이지 요청에서도 행 순서가 달라질 수 있습니다.",
          ],
        },
        tip: "애플리케이션에서 SQL 문자열을 이어 붙이지 말고 바인드 파라미터를 사용하세요. SQL 주입을 막고 실행 계획 재사용에도 유리합니다.",
      },
      {
        id: "sql-checklist",
        title: "결과가 이상할 때 확인할 순서",
        paragraphs: [
          "쿼리를 한 번에 완성하려 하지 말고 FROM 한 표부터 실행한 뒤 JOIN, WHERE, GROUP BY, HAVING 순으로 붙이면 어느 단계에서 행이 사라지거나 늘어나는지 확인하기 쉽습니다.",
          "INNER JOIN 때문에 주문 없는 회원이 사라졌는지, 일대다 JOIN 때문에 합계가 중복됐는지, NULL과 빈 문자열을 같은 것으로 착각했는지 확인하세요. Oracle은 빈 문자열을 NULL처럼 취급하는 특성이 있어 MySQL과 결과가 달라질 수 있습니다.",
        ],
        bullets: [
          "SELECT * 대신 필요한 열을 적어 결과 계약을 분명히 합니다.",
          "실행 계획(EXPLAIN)을 보고 자주 검색하는 조건에 적절한 인덱스가 있는지 확인합니다.",
          "UPDATE·DELETE 전에는 같은 WHERE의 SELECT로 대상 행을 먼저 확인합니다.",
          "운영 데이터 변경 전에는 백업과 트랜잭션 경계를 확인합니다.",
        ],
      },
    ],
    checkpoints: [
      "기본키와 외래키가 각각 무엇을 보장하는지 설명할 수 있다.",
      "INNER JOIN과 LEFT JOIN의 결과 행 차이를 예측할 수 있다.",
      "WHERE와 HAVING이 실행되는 시점의 차이를 말할 수 있다.",
      "MySQL과 Oracle의 페이징 문법 차이를 찾고 바꿀 수 있다.",
      "COMMIT 전 오류가 나면 왜 ROLLBACK해야 하는지 설명할 수 있다.",
    ],
    related: ["mybatis-mapping", "jpa-entity-lifecycle", "spring-boot-autoconfiguration"],
    sources: [
      {
        label: "공개 SQL 테이블 실습",
        repository: "https://github.com/notetester/sql",
        path: "TABLE.sql",
        note: "MySQL·Oracle DDL과 제약조건 연습 자료",
      },
      {
        label: "공개 SQL JOIN 실습",
        repository: "https://github.com/notetester/sql",
        path: "조인.sql",
        note: "관계형 표를 연결하는 JOIN 연습 자료",
      },
      {
        label: "MySQL 공식 SQL 문법 문서",
        repository: "https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html",
        note: "DDL, DML, 트랜잭션과 조회 문법을 제품 문서에서 교차 확인",
      },
    ],
  },
  {
    slug: "spring-core-di",
    track: "backend",
    order: 2,
    title: "Spring Core: IoC와 의존성 주입",
    eyebrow: "객체 생성을 맡기면 구조가 보인다",
    summary:
      "Spring 컨테이너, Bean, IoC, DI가 왜 필요한지 생성자 주입과 Java 설정으로 직접 연결합니다.",
    level: "기초",
    duration: "35분",
    why:
      "컨트롤러가 서비스와 저장소를 직접 new로 만들기 시작하면 교체와 테스트가 어려워집니다. Spring이 객체의 생성과 연결을 맡게 하면 각 클래스는 자신의 일에 집중하고 의존 관계는 설정에서 드러납니다.",
    prerequisites: [
      "Java 클래스·객체·인터페이스·생성자의 의미",
      "구현체를 new로 생성해 메서드를 호출해 본 경험",
    ],
    keywords: ["IoC", "DI", "Bean", "ApplicationContext", "생성자 주입", "컴포넌트 스캔"],
    sections: [
      {
        id: "ioc-container",
        title: "IoC는 객체 생성의 주도권을 뒤집는다",
        paragraphs: [
          "IoC(Inversion of Control, 제어의 역전)는 애플리케이션 코드가 모든 객체를 직접 만들고 연결하던 제어를 프레임워크에 넘기는 원칙입니다. Spring의 ApplicationContext는 설정을 읽어 객체를 만들고, 필요한 의존성을 연결하고, 수명까지 관리하는 컨테이너입니다.",
          "컨테이너가 관리하는 객체를 Bean이라고 합니다. Bean은 특별한 종류의 Java 객체가 아니라 Spring에 등록된 평범한 객체입니다. DI(Dependency Injection, 의존성 주입)는 한 객체가 필요로 하는 다른 객체를 밖에서 넣어 주는 IoC의 대표적인 구현 방식입니다.",
        ],
        code: {
          language: "java",
          label: "직접 생성과 주입의 차이",
          code: `// 직접 생성: Hotel이 Chef 구현 선택까지 책임진다.
class HotelBefore {
    private final Chef chef = new Chef();
}

// 생성자 주입: Hotel은 필요한 타입만 선언한다.
class Hotel {
    private final Chef chef;

    Hotel(Chef chef) {
        this.chef = chef;
    }
}`,
          explanation: [
            "Hotel은 이제 Chef를 누가 만드는지 알 필요가 없습니다.",
            "테스트에서는 실제 Chef 대신 가벼운 대역을 전달할 수 있습니다.",
          ],
        },
      },
      {
        id: "constructor-injection",
        title: "생성자 주입을 기본 선택으로 삼는다",
        paragraphs: [
          "생성자 주입은 객체가 완성되는 순간 필요한 의존성이 모두 존재하게 합니다. 필드를 final로 둘 수 있어 실행 중 의존성이 바뀌지 않는다는 사실도 코드에 드러납니다.",
          "의존성이 하나뿐인 생성자는 최신 Spring에서 @Autowired를 생략할 수 있습니다. 필드 주입은 짧아 보이지만 순수 Java 테스트에서 값을 넣기 어렵고, 클래스가 무엇을 요구하는지 생성자 시그니처에 나타나지 않으므로 새 코드에서는 피하는 편이 좋습니다.",
        ],
        code: {
          language: "java",
          label: "서비스에 저장소 주입하기",
          code: `@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order find(long id) {
        return orderRepository.findById(id);
    }
}`,
          explanation: [
            "@Service는 컴포넌트 스캔 대상임을 나타내며 역할도 사람에게 알려 줍니다.",
            "OrderRepository도 Bean이면 Spring이 같은 타입을 찾아 생성자에 전달합니다.",
          ],
        },
        result: {
          label: "컨테이너 생성 결과",
          output: `1. OrderRepository Bean 생성
2. OrderService 생성자에 OrderRepository 전달
3. orderService.find(10) 호출 가능`,
        },
      },
      {
        id: "java-configuration",
        title: "@Configuration과 @Bean으로 연결을 명시한다",
        paragraphs: [
          "외부 라이브러리 클래스처럼 @Component를 붙일 수 없거나 생성 과정을 직접 제어해야 할 때는 Java 설정을 씁니다. @Configuration 클래스의 @Bean 메서드 반환 객체가 컨테이너에 등록됩니다.",
          "XML의 bean·constructor-arg와 Java 설정의 @Bean은 표현만 다르고 같은 목적을 갖습니다. 기존 학습자료의 XML 설정을 읽을 때도 ‘어떤 객체를 만들고 무엇을 넣는가’를 찾으면 됩니다.",
        ],
        code: {
          language: "java",
          label: "Java 설정으로 Bean 연결",
          code: `@Configuration
class AppConfig {
    @Bean
    Chef chef() {
        return new Chef();
    }

    @Bean
    Hotel hotel(Chef chef) {
        return new Hotel(chef);
    }
}`,
          explanation: [
            "메서드 매개변수 Chef도 컨테이너가 찾아 주입합니다.",
            "설정에 인증정보를 문자열로 하드코딩하지 말고 환경변수나 비밀 저장소를 사용해야 합니다.",
          ],
        },
        result: {
          label: "조회 예시",
          output: `Hotel hotel = context.getBean(Hotel.class);
hotel.getChef().cook();
// 출력 예: 요리를 시작합니다.`,
        },
      },
      {
        id: "scope-and-lifecycle",
        title: "Bean의 범위와 생명주기를 이해한다",
        paragraphs: [
          "기본 scope(범위)는 singleton입니다. 같은 ApplicationContext 안에서 같은 Bean 이름을 조회하면 같은 객체를 돌려준다는 뜻이지, JVM 전체에 단 하나라는 뜻은 아닙니다. prototype은 조회할 때마다 새 객체를 만들지만 종료 처리는 컨테이너가 끝까지 책임지지 않는다는 차이가 있습니다.",
          "일반적인 서비스·저장소 Bean은 singleton으로 충분합니다. 따라서 필드에 요청별 사용자 정보처럼 바뀌는 값을 저장하면 여러 요청이 섞일 수 있습니다. 요청 데이터는 메서드의 지역 변수나 request 범위 객체로 다루세요.",
        ],
        code: {
          language: "java",
          label: "같은 Bean인지 확인",
          code: `Hotel first = context.getBean(Hotel.class);
Hotel second = context.getBean(Hotel.class);

System.out.println(first == second); // 기본 singleton이면 true`,
        },
        tip: "순환 의존성 A → B → A가 생기면 지연 주입으로 감추기보다 책임을 나누거나 이벤트로 결합을 끊을 수 있는지 먼저 검토하세요.",
      },
      {
        id: "di-troubleshooting",
        title: "주입 오류를 메시지에서 역추적한다",
        paragraphs: [
          "NoSuchBeanDefinitionException은 필요한 타입의 Bean이 없다는 뜻입니다. 패키지가 컴포넌트 스캔 범위 밖인지, 구현체에 @Component 계열 어노테이션이 있는지, 설정 클래스가 로드되는지 확인합니다.",
          "NoUniqueBeanDefinitionException은 같은 타입의 후보가 여러 개라는 뜻입니다. @Qualifier로 이름을 지정하거나 @Primary로 기본 후보를 정할 수 있지만, 왜 구현체가 여러 개인지 설계부터 살펴보는 것이 좋습니다.",
        ],
        bullets: [
          "생성자 매개변수가 지나치게 많다면 클래스가 너무 많은 책임을 가진 신호일 수 있습니다.",
          "구현체보다 인터페이스에 의존하면 테스트 대역과 다른 구현으로 교체하기 쉽습니다.",
          "단위 테스트에서는 Spring 전체를 띄우지 말고 생성자에 가짜 저장소를 직접 전달할 수 있습니다.",
        ],
      },
    ],
    checkpoints: [
      "IoC, DI, Bean, ApplicationContext를 서로 연결해 설명할 수 있다.",
      "직접 new 하는 코드와 생성자 주입 코드의 테스트 가능성 차이를 말할 수 있다.",
      "@Service와 @Bean이 각각 언제 Bean을 등록하는지 구분할 수 있다.",
      "singleton Bean에 요청별 상태를 필드로 두면 위험한 이유를 설명할 수 있다.",
    ],
    related: ["spring-mvc-request-flow", "spring-boot-autoconfiguration", "jpa-entity-lifecycle"],
    sources: [
      {
        label: "SpringDI 생성자 주입 실습",
        repository: "https://github.com/notetester/SPRING",
        path: "SpringDI/src/main/java/ex02/construct/Hotel.java",
        note: "공개 저장소에서 확인한 생성자 주입 예제",
      },
      {
        label: "SpringDI Java 설정 실습",
        repository: "https://github.com/notetester/SPRING",
        path: "SpringDI/src/main/java/ex08/javaconfig/JavaConfig.java",
        note: "@Configuration과 @Bean을 XML 설정과 비교한 자료",
      },
    ],
  },
  {
    slug: "spring-mvc-request-flow",
    track: "backend",
    order: 3,
    title: "Spring MVC 요청 흐름",
    eyebrow: "URL에서 Controller, Service, JSP까지",
    summary:
      "브라우저 요청이 DispatcherServlet을 지나 Controller·Service·Mapper와 JSP 응답으로 돌아오는 경로를 한 번에 추적합니다.",
    level: "중급",
    duration: "45분",
    why:
      "404, 400, 500 오류를 고치려면 어느 층까지 요청이 도착했는지 알아야 합니다. URL 매핑, 파라미터 바인딩, 모델, 뷰 해석을 흐름으로 이해하면 무작정 어노테이션을 바꾸지 않고 원인을 좁힐 수 있습니다.",
    prerequisites: [
      "HTTP의 GET과 POST가 서로 다른 의도를 표현한다는 것",
      "Spring Bean과 의존성 주입의 기본 개념",
      "JSP가 서버에서 HTML을 만들어 브라우저에 보낸다는 개념",
    ],
    keywords: ["DispatcherServlet", "Controller", "Model", "ViewResolver", "PRG", "데이터 바인딩"],
    sections: [
      {
        id: "front-controller",
        title: "DispatcherServlet이 요청의 입구가 된다",
        paragraphs: [
          "Spring MVC는 Front Controller 패턴을 사용합니다. 모든 웹 요청의 공통 입구인 DispatcherServlet이 URL과 HTTP 메서드에 맞는 Controller 메서드를 찾고, 필요한 값을 바인딩한 뒤 호출합니다.",
          "Controller는 HTTP 입력과 출력 형식을 다루고, 실제 업무 규칙은 Service에 위임합니다. 데이터 저장은 Mapper나 Repository에 맡깁니다. 이 경계를 지키면 화면이 바뀌어도 업무 로직을 재사용하기 쉽습니다.",
        ],
        code: {
          language: "text",
          label: "목록 요청의 전체 경로",
          code: `GET /guestbook/list
  -> DispatcherServlet
  -> GuestBookController.list()
  -> GuestBookService.selectAll()
  -> GuestBookMapper.selectAll()
  -> database
  -> Model["list"]
  -> ViewResolver
  -> /WEB-INF/views/guestbook/list.jsp
  -> HTML response`,
        },
        result: {
          label: "브라우저가 받는 것",
          output: `HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8

<table>...방명록 행...</table>`,
          explanation: "브라우저는 Java 객체나 JSP 파일 자체가 아니라 JSP가 렌더링한 HTML을 받습니다.",
        },
      },
      {
        id: "mapping-and-binding",
        title: "URL, 메서드, 입력값을 명시한다",
        paragraphs: [
          "@RequestMapping은 클래스의 공통 경로를, @GetMapping과 @PostMapping은 구체적인 HTTP 메서드와 경로를 정합니다. 같은 /write라도 GET은 입력 폼 조회, POST는 제출 처리로 나누는 편이 의도가 분명합니다.",
          "@RequestParam은 쿼리 문자열이나 폼의 한 값을, @PathVariable은 URL 경로 조각을 받습니다. 여러 폼 필드 이름이 객체의 필드명과 같으면 커맨드 객체로 묶을 수 있습니다. JSON 본문은 @RequestBody가 변환합니다.",
        ],
        code: {
          language: "java",
          label: "목록과 등록 요청 매핑",
          code: `@Controller
@RequestMapping("/guestbook")
class GuestBookController {
    private final GuestBookService service;

    GuestBookController(GuestBookService service) {
        this.service = service;
    }

    @GetMapping("/list")
    String list(Model model) {
        model.addAttribute("list", service.selectAll());
        return "guestbook/list";
    }

    @PostMapping("/write")
    String write(GuestBookForm form) {
        service.create(form);
        return "redirect:/guestbook/list";
    }
}`,
          explanation: [
            "Model의 list라는 이름과 JSP의 ${list} 표현이 연결됩니다.",
            "등록 성공 뒤 redirect하는 방식을 PRG(Post/Redirect/Get) 패턴이라고 합니다.",
          ],
        },
        result: {
          label: "등록 요청 결과",
          output: `POST /guestbook/write -> 302 Found
Location: /guestbook/list
GET /guestbook/list -> 200 OK`,
          explanation: "새로고침해도 POST가 다시 전송되지 않아 중복 등록 위험이 줄어듭니다.",
        },
      },
      {
        id: "model-and-view",
        title: "Model은 데이터, View 이름은 화면 위치다",
        paragraphs: [
          "@Controller 메서드에서 문자열을 반환하면 기본적으로 뷰의 논리 이름입니다. 예를 들어 guestbook/list에 prefix /WEB-INF/views/와 suffix .jsp가 붙어 실제 JSP 경로가 됩니다.",
          "@ResponseBody 또는 @RestController에서는 반환값이 응답 본문으로 직렬화됩니다. String을 반환했다고 무조건 JSP를 찾는 것이 아니라 컨트롤러 종류와 어노테이션을 함께 봐야 합니다.",
        ],
        code: {
          language: "jsp",
          label: "Model의 목록을 JSTL로 렌더링",
          code: `<c:choose>
  <c:when test="\${empty list}">
    <p>등록된 글이 없습니다.</p>
  </c:when>
  <c:otherwise>
    <c:forEach var="item" items="\${list}">
      <a href="\${pageContext.request.contextPath}/guestbook/detail?id=\${item.id}">
        <c:out value="\${item.subject}" />
      </a>
    </c:forEach>
  </c:otherwise>
</c:choose>`,
          explanation: [
            "c:out은 화면에 출력할 문자열을 이스케이프해 저장형 XSS 위험을 줄입니다.",
            "contextPath를 붙이면 애플리케이션이 루트가 아닌 경로에 배포되어도 링크가 맞습니다.",
          ],
        },
        tip: "JSP에 SQL이나 업무 규칙을 넣지 말고 표시 조건과 반복처럼 화면 표현에 필요한 코드만 둡니다.",
      },
      {
        id: "error-location",
        title: "상태 코드로 실패 지점을 좁힌다",
        paragraphs: [
          "404는 보통 URL 매핑이나 뷰 파일 경로를 찾지 못한 경우, 400은 파라미터 변환이나 검증에 실패한 경우, 500은 Controller 이후 코드에서 처리되지 않은 예외가 난 경우입니다. 로그에서 최초 원인(caused by)을 찾아야 합니다.",
          "브라우저 개발자 도구의 Network에서 실제 URL·메서드·상태 코드를 보고, Controller 진입 로그, Service 로그, SQL 로그 순서로 확인하면 요청이 멈춘 층을 알 수 있습니다. 비밀번호·토큰·개인정보는 로그에 남기지 않습니다.",
        ],
        code: {
          language: "bash",
          label: "curl로 매핑과 응답 확인",
          code: `curl -i "http://localhost:8080/guestbook/list"

curl -i -X POST "http://localhost:8080/guestbook/write" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "writer=학습자" \
  --data-urlencode "subject=첫 글"`,
        },
        result: {
          label: "진단 기준",
          output: `404 -> 매핑/경로 확인
400 -> 입력 이름·자료형·검증 확인
401/403 -> 인증·인가 필터 확인
500 -> 서버 로그의 최초 예외 확인`,
        },
      },
      {
        id: "mvc-pitfalls",
        title: "Controller를 얇게 유지한다",
        paragraphs: [
          "Controller에서 파일 저장, 암호화, 여러 SQL, 외부 API 호출을 모두 처리하면 테스트와 예외 처리가 복잡해집니다. Controller는 입력 검증과 응답 선택에 집중하고, 하나의 업무 단위는 Service 메서드로 옮기세요.",
          "수정·삭제 같은 상태 변경을 GET으로 만들면 링크 미리보기나 크롤러 요청만으로 데이터가 바뀔 수 있습니다. POST·PUT·PATCH·DELETE를 사용하고 CSRF 방어와 권한 검사를 함께 적용해야 합니다.",
        ],
        bullets: [
          "요청 DTO와 DB Entity를 분리하면 공개하면 안 되는 필드가 자동 바인딩되는 문제를 줄일 수 있습니다.",
          "검증 오류는 사용자가 고칠 수 있는 메시지와 함께 400 계열로 반환합니다.",
          "redirect:는 새 요청, 일반 뷰 반환은 같은 요청에서 렌더링된다는 차이를 기억합니다.",
        ],
      },
    ],
    checkpoints: [
      "GET /guestbook/list가 HTML로 돌아오기까지 구성요소를 순서대로 말할 수 있다.",
      "@RequestParam, @PathVariable, @RequestBody의 입력 위치를 구분할 수 있다.",
      "Model의 속성 이름이 JSP 표현식과 어떻게 연결되는지 설명할 수 있다.",
      "등록 후 redirect가 중복 제출을 줄이는 이유를 설명할 수 있다.",
      "404·400·500을 보고 첫 확인 지점을 정할 수 있다.",
    ],
    related: ["spring-core-di", "mybatis-mapping", "spring-boot-autoconfiguration"],
    sources: [
      {
        label: "Spring MVC Controller 실습",
        repository: "https://github.com/notetester/SPRING",
        path: "SpringBasic/src/main/java/com/simple/controller/BoardServiceController.java",
        note: "공개 저장소의 Controller-Service 흐름",
      },
      {
        label: "Spring MVC JSP 목록 화면",
        repository: "https://github.com/notetester/SPRING",
        path: "SpringBasic/src/main/webapp/WEB-INF/views/service/boardList.jsp",
        note: "공개 저장소의 Model, JSTL 반복, 상세 링크 흐름",
      },
    ],
  },
  {
    slug: "mybatis-mapping",
    track: "backend",
    order: 4,
    title: "MyBatis 매핑: Java 메서드와 SQL 연결하기",
    eyebrow: "SQL을 직접 보면서 반복 코드는 줄이기",
    summary:
      "Mapper 인터페이스와 XML의 id·namespace·파라미터·결과 매핑이 어떻게 한 번의 DB 호출로 연결되는지 배웁니다.",
    level: "중급",
    duration: "40분",
    why:
      "MyBatis는 SQL을 숨기지 않으면서 JDBC의 연결·PreparedStatement·ResultSet 반복 코드를 줄여 줍니다. 대신 Java와 XML 사이의 이름 계약이 정확해야 하므로 매핑 규칙을 모르면 실행 시점 오류를 찾기 어렵습니다.",
    prerequisites: [
      "SELECT·INSERT·UPDATE와 바인드 파라미터의 목적",
      "Spring의 Controller-Service 계층과 의존성 주입",
      "Java 인터페이스와 객체 필드의 기본 문법",
    ],
    keywords: ["Mapper", "namespace", "#{parameter}", "resultMap", "동적 SQL", "PreparedStatement"],
    sections: [
      {
        id: "mapper-contract",
        title: "인터페이스와 XML은 이름으로 계약한다",
        paragraphs: [
          "Mapper 인터페이스는 애플리케이션이 호출할 DB 작업의 모양을 선언합니다. XML의 mapper namespace는 인터페이스의 전체 클래스 이름과 같아야 하고, select·insert 같은 문장의 id는 메서드 이름과 같아야 합니다.",
          "Spring Boot의 MyBatis starter는 @Mapper 인터페이스의 프록시(proxy, 실제 객체를 대신해 호출을 전달하는 객체)를 만들어 Bean으로 등록합니다. 서비스가 메서드를 호출하면 프록시가 맞는 XML 문장을 찾아 파라미터를 바인딩하고 결과를 변환합니다.",
        ],
        code: {
          language: "xml",
          label: "인터페이스와 연결되는 XML",
          code: `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="study.guestbook.GuestBookMapper">
  <select id="selectById" parameterType="long"
          resultType="study.guestbook.GuestBookDto">
    SELECT g_idx, g_writer, g_subject, g_regdate
    FROM guestbook
    WHERE g_idx = #{id}
  </select>
</mapper>`,
          explanation: [
            "namespace와 id가 틀리면 BindingException처럼 ‘문장을 찾지 못했다’는 오류가 납니다.",
            "DTD URL은 Mapper XML 구조를 정의하며 애플리케이션의 DB 주소가 아닙니다.",
          ],
        },
        result: {
          label: "호출 결과",
          output: `mapper.selectById(7)
-> SQL의 #{id}에 7 바인딩
-> 한 행을 GuestBookDto로 변환`,
        },
      },
      {
        id: "safe-parameters",
        title: "#{ }는 값, ${ }는 SQL 조각이다",
        paragraphs: [
          "#{value}는 JDBC의 ? 자리표시자로 바뀌고 값은 별도로 전달됩니다. 데이터와 SQL 문법이 분리되므로 따옴표 처리와 SQL 주입 방어에 유리합니다. 사용자 입력은 원칙적으로 #{ }로 바인딩합니다.",
          "${value}는 문자열을 SQL에 그대로 삽입합니다. 열 이름이나 정렬 방향처럼 ?로 바인딩할 수 없는 문법 조각에 쓰기도 하지만, 허용 목록으로 검증하지 않으면 공격자가 SQL 구조를 바꿀 수 있습니다.",
        ],
        code: {
          language: "xml",
          label: "안전한 검색과 정렬 허용 목록",
          code: `<select id="search" resultType="GuestBookDto">
  SELECT g_idx, g_subject, g_writer
  FROM guestbook
  WHERE g_active = 0
    AND g_subject LIKE CONCAT('%', #{keyword}, '%')
  ORDER BY
  <choose>
    <when test="sort == 'writer'">g_writer</when>
    <otherwise>g_regdate</otherwise>
  </choose>
  DESC
</select>`,
          explanation: [
            "사용자 입력 keyword는 #{ }로 바인딩합니다.",
            "정렬 열은 ${sort}로 직접 삽입하지 않고 choose로 허용된 SQL만 선택합니다.",
          ],
        },
        result: {
          label: "실제 실행 형태",
          output: `Preparing: ... g_subject LIKE CONCAT('%', ?, '%') ORDER BY g_regdate DESC
Parameters: spring(String)`,
          explanation: "로그에서도 SQL 구조와 값이 분리되어 보입니다. 운영 로그에는 개인정보가 포함되지 않도록 설정해야 합니다.",
        },
      },
      {
        id: "result-mapping",
        title: "열 이름과 Java 필드를 명시적으로 맞춘다",
        paragraphs: [
          "SQL의 snake_case 열과 Java의 camelCase 필드가 다르면 자동 변환 설정을 사용하거나 별칭(alias), resultMap으로 관계를 적어야 합니다. 자동 규칙에만 의존하면 설정 차이로 일부 필드가 조용히 null이 될 수 있습니다.",
          "resultMap은 기본키·일반 필드뿐 아니라 연관 객체와 컬렉션도 매핑할 수 있습니다. 다만 JOIN 결과에서 부모 행이 반복되므로 id 요소를 정확히 지정해야 중복 객체를 줄일 수 있습니다.",
        ],
        code: {
          language: "xml",
          label: "명시적인 resultMap",
          code: `<resultMap id="guestBookMap" type="GuestBookDto">
  <id property="id" column="g_idx" />
  <result property="writer" column="g_writer" />
  <result property="subject" column="g_subject" />
  <result property="registeredAt" column="g_regdate" />
</resultMap>

<select id="selectAll" resultMap="guestBookMap">
  SELECT g_idx, g_writer, g_subject, g_regdate
  FROM guestbook
  WHERE g_active = 0
  ORDER BY g_idx DESC
</select>`,
        },
        result: {
          label: "변환된 객체",
          output: `GuestBookDto {
  id: 12,
  writer: "학습자",
  subject: "MyBatis 복습",
  registeredAt: 2026-07-10T14:30
}`,
        },
      },
      {
        id: "dynamic-and-transaction",
        title: "동적 SQL과 트랜잭션의 책임을 나눈다",
        paragraphs: [
          "if·choose·where·set·foreach는 조건에 따라 SQL 조각을 조립합니다. where는 조건이 하나라도 있을 때만 WHERE를 붙이고 첫 AND/OR를 정리하며, set은 UPDATE의 불필요한 쉼표를 정리합니다.",
          "Mapper 한 번의 호출보다 ‘게시글과 첨부파일을 함께 등록’ 같은 업무 단위가 더 큽니다. 이때 트랜잭션은 XML이 아니라 Service 메서드의 @Transactional로 묶는 것이 일반적입니다. RuntimeException이 전파되어야 기본 롤백이 일어납니다.",
        ],
        code: {
          language: "java",
          label: "두 Mapper 호출을 하나의 작업으로",
          code: `@Service
public class PostService {
    private final PostMapper postMapper;
    private final FileMapper fileMapper;

    @Transactional
    public long create(PostForm form) {
        postMapper.insert(form);          // 생성된 id를 form에 채움
        fileMapper.insertAll(form.id(), form.files());
        return form.id();
    }
}`,
          explanation: [
            "두 번째 INSERT가 실패하면 첫 번째 INSERT도 롤백되어야 일관성이 유지됩니다.",
            "예외를 catch하고 성공처럼 끝내면 롤백되지 않을 수 있으므로 복구할 수 없는 예외는 다시 던집니다.",
          ],
        },
      },
      {
        id: "mybatis-comparison",
        title: "JDBC와 JPA 사이에서 장단점을 고른다",
        paragraphs: [
          "JDBC는 모든 SQL 실행과 결과 변환을 직접 제어하지만 반복 코드가 많습니다. MyBatis는 SQL 제어권을 유지하면서 바인딩과 매핑을 줄입니다. JPA는 객체 상태 변경을 중심으로 SQL 생성을 더 많이 위임합니다.",
          "복잡한 조회 SQL과 기존 스키마를 정확히 활용해야 한다면 MyBatis가 편할 수 있습니다. 도메인 객체의 관계와 변경을 중심으로 개발한다면 JPA가 잘 맞을 수 있습니다. 어느 도구든 실제 SQL과 인덱스를 모르면 성능 문제를 피할 수 없습니다.",
        ],
        bullets: [
          "namespace·id·parameterType·resultType 오타는 컴파일보다 실행 시점에 발견되는 경우가 많습니다.",
          "SELECT *는 스키마 변경 영향을 키우므로 필요한 열을 명시합니다.",
          "한 목록을 가져온 뒤 반복문에서 상세 쿼리를 매번 부르는 N+1 패턴을 주의합니다.",
          "Mapper XML을 수정한 뒤 실제 쿼리와 반환 행 수를 통합 테스트로 확인합니다.",
        ],
        tip: "오류가 나면 Mapper 메서드의 전체 이름, XML namespace와 id, 파라미터 이름, DB에 실제 존재하는 열 순서로 비교하세요.",
      },
    ],
    checkpoints: [
      "Mapper 인터페이스 호출이 XML 문장으로 연결되는 규칙을 설명할 수 있다.",
      "#{ }와 ${ }의 차이와 사용자 입력에 ${ }를 쓰면 위험한 이유를 말할 수 있다.",
      "snake_case 열을 camelCase 필드에 안전하게 매핑할 수 있다.",
      "여러 Mapper 호출을 Service의 트랜잭션으로 묶을 수 있다.",
      "MyBatis와 JPA 중 무엇을 선택할지 SQL 제어권 관점에서 비교할 수 있다.",
    ],
    related: ["relational-sql-mysql-oracle", "spring-mvc-request-flow", "jpa-entity-lifecycle"],
    sources: [
      {
        label: "SpringBasic Mapper 인터페이스",
        repository: "https://github.com/notetester/SPRING",
        path: "SpringBasic/src/main/java/com/simple/mapper/BoardMapper.java",
        note: "공개 저장소의 Java Mapper 계약",
      },
      {
        label: "SpringBasic Mapper XML",
        repository: "https://github.com/notetester/SPRING",
        path: "SpringBasic/src/main/resources/sqlmap/BoardMapper.xml",
        note: "namespace, id, SQL 매핑 실습",
      },
      {
        label: "MyBatis 공식 동적 SQL 문서",
        repository: "https://mybatis.org/mybatis-3/dynamic-sql.html",
        note: "if, choose, where, set, foreach의 공식 동작 확인",
      },
    ],
  },
  {
    slug: "jpa-entity-lifecycle",
    track: "backend",
    order: 5,
    title: "JPA Entity와 영속성 생명주기",
    eyebrow: "객체의 변화가 SQL이 되는 순간",
    summary:
      "Entity 매핑, 영속성 컨텍스트, 상태 전이, 변경 감지와 Spring Data Repository를 방명록 예제로 이해합니다.",
    level: "중급",
    duration: "45분",
    why:
      "JPA에서는 UPDATE 메서드를 직접 부르지 않아도 SQL이 실행될 수 있고, 같은 객체를 조회했는데 쿼리가 다시 나가지 않을 수도 있습니다. 객체 상태와 트랜잭션 경계를 이해해야 ‘마법처럼 보이는’ 동작을 예측할 수 있습니다.",
    prerequisites: [
      "관계형 표의 기본키·열·외래키 개념",
      "Java 클래스와 객체, Spring Service와 트랜잭션의 기본",
      "MyBatis처럼 SQL을 직접 매핑하는 방식의 개요",
    ],
    keywords: ["ORM", "Entity", "Persistence Context", "dirty checking", "JPQL", "Repository"],
    sections: [
      {
        id: "orm-entity",
        title: "Entity는 표와 연결된 도메인 객체다",
        paragraphs: [
          "ORM(Object-Relational Mapping)은 객체와 관계형 표 사이의 차이를 매핑하는 기술입니다. JPA는 Java의 ORM 표준이고, Spring Boot에서는 보통 Hibernate 구현체를 Spring Data JPA와 함께 사용합니다.",
          "@Entity가 붙은 클래스는 영속 대상입니다. @Id는 식별자, @GeneratedValue는 키 생성 방식, @Column은 열 이름과 제약을 표현합니다. Entity를 API 응답에 그대로 노출하기보다 요청·응답 DTO를 분리하면 지연 로딩과 민감 필드 노출 문제를 줄일 수 있습니다.",
        ],
        code: {
          language: "java",
          label: "방명록 Entity",
          code: `@Entity
@Table(name = "guestbook")
public class GuestBook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "g_idx")
    private Long id;

    @Column(name = "g_writer", nullable = false)
    private String writer;

    @Column(name = "g_subject", nullable = false)
    private String subject;

    @Column(name = "g_regdate", updatable = false)
    private LocalDateTime registeredAt;

    @PrePersist
    void prePersist() {
        registeredAt = LocalDateTime.now();
    }
}`,
          explanation: [
            "IDENTITY는 MySQL의 AUTO_INCREMENT처럼 INSERT 후 키를 받는 전략에 주로 대응합니다.",
            "@PrePersist는 처음 저장되기 직전에 호출되는 생명주기 콜백입니다.",
          ],
        },
        result: {
          label: "저장 시 예상 SQL",
          output: `insert into guestbook (g_regdate, g_subject, g_writer)
values (?, ?, ?)`,
          explanation: "실제 SQL은 JPA 구현체와 설정에 따라 열 순서나 표현이 달라질 수 있습니다.",
        },
      },
      {
        id: "persistence-states",
        title: "비영속·영속·준영속·삭제 상태를 구분한다",
        paragraphs: [
          "new로 만든 객체는 비영속(transient) 상태입니다. persist나 Repository.save를 통해 영속성 컨텍스트가 관리하면 영속(managed) 상태가 됩니다. 컨텍스트에서 분리되면 준영속(detached), remove가 예약되면 삭제(removed) 상태입니다.",
          "영속성 컨텍스트는 트랜잭션 안에서 Entity의 스냅샷을 기억합니다. 커밋 또는 flush 시점에 현재 값과 비교해 달라진 열의 UPDATE를 만드는 기능이 변경 감지(dirty checking)입니다.",
        ],
        code: {
          language: "java",
          label: "변경 감지로 제목 수정",
          code: `@Service
public class GuestBookService {
    private final GuestBookRepository repository;

    @Transactional
    public void rename(long id, String newSubject) {
        GuestBook entry = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("글이 없습니다."));

        entry.changeSubject(newSubject);
        // 영속 Entity이므로 별도 update 호출 없이 커밋 때 반영된다.
    }
}`,
          explanation: [
            "트랜잭션 밖에서 조회한 준영속 객체를 바꿔도 자동 UPDATE를 기대할 수 없습니다.",
            "Entity에 의미 있는 변경 메서드를 두면 아무 필드나 바꾸는 setter보다 규칙을 지키기 쉽습니다.",
          ],
        },
        result: {
          label: "커밋 시점",
          output: `select ... from guestbook where g_idx=?
update guestbook set g_subject=? where g_idx=?
commit`,
        },
      },
      {
        id: "spring-data-repository",
        title: "Repository는 반복 CRUD를 줄인다",
        paragraphs: [
          "JpaRepository<Entity, IdType>를 상속하면 save, findById, findAll, delete 같은 기본 메서드를 받습니다. 메서드 이름 규칙으로 findByActiveOrderByIdDesc 같은 쿼리를 만들 수도 있습니다.",
          "JPQL은 표와 열 대신 Entity 클래스와 필드 이름을 대상으로 질의합니다. 복잡한 조회가 늘면 이름이 지나치게 긴 파생 메서드보다 @Query, Criteria, Querydsl, 전용 조회 저장소 등을 검토합니다.",
        ],
        code: {
          language: "java",
          label: "파생 쿼리와 JPQL",
          code: `public interface GuestBookRepository
        extends JpaRepository<GuestBook, Long> {

    List<GuestBook> findByActiveOrderByIdDesc(int active);

    @Query("select g from GuestBook g " +
           "where g.active = 0 and g.writer = :writer")
    List<GuestBook> findVisibleByWriter(@Param("writer") String writer);
}`,
          explanation: [
            "GuestBook과 active, writer는 DB 이름이 아니라 Entity와 필드 이름입니다.",
            "사용자 값은 :writer로 바인딩되므로 문자열 연결을 피합니다.",
          ],
        },
        result: {
          label: "파생 메서드 해석",
          output: `findByActiveOrderByIdDesc(0)
-> WHERE active = 0
-> ORDER BY id DESC`,
        },
      },
      {
        id: "relations-and-n-plus-one",
        title: "연관관계와 N+1을 경계한다",
        paragraphs: [
          "@ManyToOne과 @OneToMany는 외래키 관계를 객체 참조로 표현합니다. 연관관계의 주인은 외래키 열을 실제로 관리하는 쪽입니다. 양방향 관계를 무심코 JSON으로 직렬화하면 서로를 계속 따라가는 순환 참조가 생길 수 있습니다.",
          "목록 한 번(1) 뒤 각 행의 연관 객체를 읽을 때마다 추가 쿼리(N)가 실행되는 현상을 N+1이라고 합니다. fetch join, EntityGraph, DTO projection, 배치 로딩 중 조회 목적에 맞는 방법을 골라야 합니다. 모든 관계를 EAGER로 바꾸는 것은 과조회와 더 큰 JOIN을 만들 수 있어 해결책이 아닙니다.",
        ],
        code: {
          language: "java",
          label: "필요한 연관만 fetch join",
          code: `@Query("""
    select o from Order o
    join fetch o.member
    where o.status = :status
    order by o.id desc
    """)
List<Order> findWithMemberByStatus(OrderStatus status);`,
          explanation: [
            "fetch join은 이번 조회에서 Order와 Member를 함께 로딩하라고 지정합니다.",
            "컬렉션 fetch join과 페이징을 함께 쓰면 결과가 예상과 다를 수 있어 별도 전략이 필요합니다.",
          ],
        },
      },
      {
        id: "jpa-pitfalls",
        title: "JPA를 SQL 대신이 아니라 SQL 생성 도구로 본다",
        paragraphs: [
          "JPA도 결국 SQL을 실행합니다. 트랜잭션 안에서 flush가 언제 일어나는지, 어떤 JOIN과 쿼리 수가 생기는지 로그와 테스트로 확인해야 합니다. 운영에서는 바인드 값에 개인정보가 섞이지 않도록 로그 수준을 조절합니다.",
          "MyBatis는 복잡한 SQL의 모양을 직접 통제하기 쉽고 JPA는 객체 그래프와 변경 추적에 강합니다. 한 프로젝트에서 명령은 JPA, 복잡한 보고서 조회는 별도 SQL 도구처럼 목적에 따라 조합할 수도 있습니다.",
        ],
        bullets: [
          "equals/hashCode에 변경 가능한 모든 필드를 넣으면 컬렉션과 프록시에서 문제가 생길 수 있습니다.",
          "낙관적 잠금이 필요하면 @Version으로 동시 수정 충돌을 감지할 수 있습니다.",
          "save가 항상 INSERT인 것은 아닙니다. 식별자와 Entity 상태에 따라 merge가 일어날 수 있습니다.",
          "DDL 자동 생성은 학습에는 편하지만 운영 스키마 변경은 검토 가능한 마이그레이션으로 관리합니다.",
        ],
      },
    ],
    checkpoints: [
      "@Entity, @Id, @GeneratedValue가 각각 무엇을 표현하는지 말할 수 있다.",
      "비영속·영속·준영속·삭제 상태를 예제로 구분할 수 있다.",
      "@Transactional 안의 변경 감지가 UPDATE를 만드는 시점을 설명할 수 있다.",
      "JPQL이 SQL과 어떤 이름 체계를 사용하는지 구분할 수 있다.",
      "N+1이 발생하는 요청 흐름을 발견하고 해결 후보를 제시할 수 있다.",
    ],
    related: ["relational-sql-mysql-oracle", "mybatis-mapping", "spring-boot-autoconfiguration"],
    sources: [
      {
        label: "방명록 JPA Entity",
        repository: "https://github.com/nohssam/2026-spring-jpa-test",
        path: "src/main/java/com/study/jpatest/guestbook/entity/GuestBook.java",
        note: "공개 원본에서 확인한 @Entity, @PrePersist, 소프트 삭제 예제",
      },
      {
        label: "Spring Data Repository",
        repository: "https://github.com/nohssam/2026-spring-jpa-test",
        path: "src/main/java/com/study/jpatest/guestbook/repository/GuestBookRepository.java",
        note: "공개 원본의 파생 쿼리와 JPQL 예제",
      },
    ],
  },
  {
    slug: "spring-boot-autoconfiguration",
    track: "backend",
    order: 6,
    title: "Spring Boot 자동 설정과 Starter",
    eyebrow: "한 줄 실행 뒤에서 벌어지는 일",
    summary:
      "@SpringBootApplication, Starter, 조건부 자동 설정, 외부 설정이 어떻게 실행 가능한 Spring 애플리케이션을 조립하는지 살펴봅니다.",
    level: "중급",
    duration: "40분",
    why:
      "Spring Boot는 설정을 없애는 도구가 아니라 합리적인 기본값을 조건에 따라 제공하는 도구입니다. 무엇이 자동으로 등록됐는지 이해하면 Bean 충돌, DataSource 오류, 서버 미기동을 빠르게 진단할 수 있습니다.",
    prerequisites: [
      "Spring Bean, 컴포넌트 스캔, Java 설정의 의미",
      "Gradle 또는 Maven이 라이브러리를 내려받아 classpath를 만든다는 개념",
      "환경에 따라 DB 주소나 포트가 달라질 수 있다는 사실",
    ],
    keywords: ["Spring Boot", "Auto-configuration", "Starter", "classpath", "externalized configuration", "condition report"],
    sections: [
      {
        id: "spring-boot-application",
        title: "@SpringBootApplication은 세 기능의 묶음이다",
        paragraphs: [
          "SpringApplication.run은 ApplicationContext를 만들고 설정을 읽고 내장 웹 서버까지 시작합니다. @SpringBootApplication은 @Configuration, @EnableAutoConfiguration, @ComponentScan을 합친 편의 어노테이션입니다.",
          "컴포넌트 스캔은 메인 클래스가 있는 패키지부터 하위 패키지를 찾습니다. Controller가 스캔되지 않을 때 무작정 scanBasePackages를 늘리기보다 메인 클래스를 애플리케이션의 루트 패키지에 두는 구조가 가장 이해하기 쉽습니다.",
        ],
        code: {
          language: "java",
          label: "Spring Boot 진입점",
          code: `@SpringBootApplication
public class StudyApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyApplication.class, args);
    }
}`,
          explanation: [
            "실행 결과로 반환되는 ApplicationContext에서 등록된 Bean을 조회할 수 있습니다.",
            "주 애플리케이션에는 보통 @SpringBootApplication을 하나만 둡니다.",
          ],
        },
        result: {
          label: "웹 Starter가 있을 때의 시작 로그",
          output: `... Tomcat initialized with port 8080
... Started StudyApplication in 2.4 seconds`,
          explanation: "정확한 문구와 시간은 버전·환경에 따라 달라지지만 서버 포트와 Started 메시지가 핵심입니다.",
        },
      },
      {
        id: "starters-and-conditions",
        title: "Starter가 classpath를 만들고 자동 설정이 조건을 본다",
        paragraphs: [
          "Starter는 한 기능에 흔히 필요한 의존성 묶음입니다. web starter를 추가하면 MVC, JSON 변환, 내장 서버 관련 라이브러리가 함께 들어옵니다. JPA starter는 JPA API, Hibernate, Spring Data JPA를 조합합니다.",
          "자동 설정은 ‘이 클래스가 classpath에 있는가’, ‘사용자가 같은 타입의 Bean을 이미 만들었는가’, ‘특정 설정값이 있는가’ 같은 조건을 평가합니다. 사용자가 직접 Bean을 만들면 @ConditionalOnMissingBean 조건의 기본 Bean은 물러나는 방식이라 점진적으로 교체할 수 있습니다.",
        ],
        code: {
          language: "groovy",
          label: "기능별 Starter 선택",
          code: `dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    runtimeOnly 'com.mysql:mysql-connector-j'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}`,
          explanation: [
            "runtimeOnly 드라이버는 컴파일 API로 직접 쓰지 않지만 실행 시 JDBC 연결에 필요합니다.",
            "기존 실습의 webmvc·jdbc·mybatis starter도 같은 방식으로 필요한 자동 설정 후보를 더합니다.",
          ],
        },
        result: {
          label: "조건에 따른 조립 예",
          output: `web starter 발견 -> DispatcherServlet, JSON converter, embedded server 후보
JPA + JDBC driver + datasource settings -> DataSource, EntityManager 후보`,
        },
      },
      {
        id: "external-configuration",
        title: "코드와 환경별 값을 분리한다",
        paragraphs: [
          "외부 설정(externalized configuration)은 같은 빌드 산출물을 개발·테스트·운영 환경에서 서로 다른 값으로 실행하게 합니다. application.yml, 환경변수, 명령줄 인수 등 여러 출처가 있으며 우선순위가 높은 값이 낮은 값을 덮습니다.",
          "DB 비밀번호, JWT 서명키, 클라우드 키는 저장소에 커밋하지 않습니다. 설정 파일에는 환경변수 자리표시자와 비민감 기본값만 두고 실제 값은 로컬 비밀 파일, CI secret, 클라우드 secret manager에서 주입합니다.",
        ],
        code: {
          language: "yaml",
          label: "공개해도 되는 설정 모양",
          code: `server:
  port: \${SERVER_PORT:8080}

spring:
  datasource:
    url: \${DB_URL}
    username: \${DB_USER}
    password: \${DB_PASSWORD}

app:
  cors-origins: \${CORS_ORIGINS:http://localhost:3000}`,
          explanation: [
            "${NAME:default}는 환경변수가 없을 때 default를 사용한다는 뜻입니다.",
            "비밀값에는 기본값을 두지 않아 누락 시 시작 단계에서 실패하도록 하는 편이 안전합니다.",
          ],
        },
        tip: "설정 전체를 로그에 출력하지 마세요. 문제 해결 로그에서도 password, token, secret, Authorization 헤더는 마스킹합니다.",
      },
      {
        id: "diagnose-autoconfig",
        title: "Condition report로 자동 설정 이유를 확인한다",
        paragraphs: [
          "자동 설정이 기대와 다를 때는 추측보다 조건 평가 보고서를 봅니다. --debug로 실행하면 어떤 자동 설정이 조건에 맞았고 왜 제외됐는지 확인할 수 있습니다. Bean 이름 충돌이면 이미 등록된 Bean과 자동 설정 후보를 함께 찾습니다.",
          "Failed to configure a DataSource는 흔히 JDBC/JPA starter는 있는데 연결 설정이나 내장 DB가 없는 경우입니다. 포트 사용 중 오류는 내장 서버 시작 전후의 별개 문제입니다. 가장 아래의 원인 예외와 condition report를 분리해 읽으세요.",
        ],
        code: {
          language: "bash",
          label: "실행과 자동 설정 진단",
          code: `./gradlew bootRun --args='--debug'

# 빌드된 jar를 같은 방식으로 진단
java -jar build/libs/study-app.jar --debug --server.port=8081`,
        },
        result: {
          label: "보고서에서 찾을 항목",
          output: `Positive matches: 조건을 만족해 적용된 자동 설정
Negative matches: 어떤 조건이 없어 제외됐는지
Exclusions: 명시적으로 제외한 자동 설정`,
        },
      },
      {
        id: "boot-comparison",
        title: "전통 Spring 설정과 Boot의 경계를 이해한다",
        paragraphs: [
          "전통 Spring MVC에서는 DispatcherServlet, ViewResolver, DataSource 등을 XML이나 Java 설정으로 직접 조립하는 경우가 많았습니다. Boot는 같은 Spring 구성요소를 Starter와 조건부 기본값으로 빠르게 조립하고 실행 가능한 jar로 묶습니다.",
          "편리하다고 모든 Starter를 추가하면 사용하지 않는 자동 설정과 공격 표면, 시작 시간이 늘 수 있습니다. 필요한 기능만 추가하고 의존성 트리와 Actuator의 조건 정보를 점검하세요. 특정 자동 설정 제외는 원인을 이해한 뒤 좁은 범위에서 사용합니다.",
        ],
        bullets: [
          "버전은 임의로 섞기보다 Spring Boot의 dependency management가 관리하는 조합을 우선합니다.",
          "메인 클래스의 패키지 위치가 Entity·Repository·Component 탐색 범위를 결정할 수 있습니다.",
          "devtools는 개발 전용이며 운영 런타임에 포함하지 않습니다.",
          "테스트를 건너뛴 빌드 성공은 동작 검증 성공과 같지 않습니다.",
        ],
      },
    ],
    checkpoints: [
      "@SpringBootApplication에 포함된 세 가지 핵심 역할을 말할 수 있다.",
      "Starter 추가가 자동 설정 후보를 만드는 과정을 classpath와 연결할 수 있다.",
      "환경변수 자리표시자를 사용해 비밀값을 코드에서 분리할 수 있다.",
      "DataSource 자동 설정 오류가 났을 때 condition report에서 원인을 찾을 수 있다.",
      "전통 Spring MVC 설정과 Spring Boot의 관계를 대체가 아닌 조립 방식 차이로 설명할 수 있다.",
    ],
    related: ["spring-core-di", "spring-mvc-request-flow", "jpa-entity-lifecycle"],
    sources: [
      {
        label: "Spring Boot JPA 실습 진입점",
        repository: "https://github.com/nohssam/2026-spring-jpa-test",
        path: "src/main/java/com/study/jpatest/JpaTestApplication.java",
        note: "공개 원본의 @SpringBootApplication 실행 구조",
      },
      {
        label: "Spring Boot 공식 자동 설정 문서",
        repository: "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html",
        note: "조건부 자동 설정과 사용자 설정으로 교체하는 원칙",
      },
      {
        label: "Spring Boot JPA Starter 구성",
        repository: "https://github.com/nohssam/2026-spring-jpa-test",
        path: "build.gradle",
        note: "공개 원본에서 webmvc·jdbc·data-jpa Starter 조합 확인",
      },
    ],
  },
  {
    slug: "react-components-state",
    track: "frontend-devops",
    order: 1,
    title: "React 컴포넌트와 상태",
    eyebrow: "화면을 데이터의 함수로 생각하기",
    summary:
      "JSX, props, state, 불변 업데이트, Effect와 전역 상태를 연결해 React가 언제 다시 렌더링하는지 이해합니다.",
    level: "기초",
    duration: "45분",
    why:
      "일반 변수 값은 바뀌었는데 화면이 그대로이거나, Effect가 무한 반복되거나, 목록 한 항목을 바꿨는데 다른 곳까지 변하는 문제는 React의 렌더링 모델을 놓쳤을 때 생깁니다. 규칙을 암기하기보다 데이터가 화면으로 변환되는 순서를 익혀야 합니다.",
    prerequisites: [
      "JavaScript의 함수, 배열 map, 객체·배열 펼침 문법",
      "HTML 요소와 이벤트의 기본 개념",
      "브라우저가 DOM을 화면에 렌더링한다는 개념",
    ],
    keywords: ["component", "JSX", "props", "state", "useEffect", "immutable update", "Zustand"],
    sections: [
      {
        id: "component-and-props",
        title: "컴포넌트는 입력을 받아 UI를 반환하는 함수다",
        paragraphs: [
          "React 컴포넌트는 재사용 가능한 화면 단위입니다. 함수 컴포넌트는 props라는 입력을 받아 JSX를 반환합니다. JSX는 HTML처럼 보이지만 JavaScript 안에서 UI 구조를 표현하는 문법이며 빌드 과정에서 React 요소 생성 코드로 변환됩니다.",
          "props는 부모가 자식에게 내려주는 읽기 전용 값입니다. 자식이 props를 직접 바꾸지 않고, 변경이 필요하면 부모가 전달한 콜백을 호출해 부모 상태를 갱신합니다. 이를 단방향 데이터 흐름이라고 합니다.",
        ],
        code: {
          language: "jsx",
          label: "props와 이벤트 콜백",
          code: `function Profile({ name, active, onToggle }) {
  return (
    <article>
      <h2>{name}</h2>
      <p>{active ? "활성" : "비활성"}</p>
      <button type="button" onClick={onToggle}>상태 전환</button>
    </article>
  );
}

function ProfilePage() {
  const [active, setActive] = useState(true);
  return (
    <Profile
      name="학습자"
      active={active}
      onToggle={() => setActive(value => !value)}
    />
  );
}`,
          explanation: [
            "자식은 active를 수정하지 않고 onToggle을 호출합니다.",
            "setActive의 함수형 업데이트는 가장 최신 상태를 기준으로 다음 값을 계산합니다.",
          ],
        },
        result: {
          label: "클릭 결과",
          output: `첫 렌더: 학습자 / 활성
버튼 클릭 -> 부모 state 변경
다음 렌더: 학습자 / 비활성`,
        },
      },
      {
        id: "state-rerender",
        title: "일반 변수와 state의 차이는 재렌더 요청이다",
        paragraphs: [
          "함수 안의 일반 변수를 바꿔도 React는 그 사실을 모르므로 화면을 다시 그리지 않습니다. useState는 현재 렌더의 상태 스냅샷과 다음 렌더를 예약하는 setter를 제공합니다.",
          "setter 호출 직후 같은 함수 안에서 state가 즉시 바뀐다고 생각하면 안 됩니다. React는 여러 업데이트를 묶어 처리할 수 있고, 다음 렌더에서 새 값이 보입니다. 이전 값에 기반한 연속 업데이트에는 함수형 setter를 사용하세요.",
        ],
        code: {
          language: "jsx",
          label: "화면과 함께 변하는 카운터",
          code: `function Counter() {
  const [count, setCount] = useState(0);

  const addThree = () => {
    setCount(value => value + 1);
    setCount(value => value + 1);
    setCount(value => value + 1);
  };

  return (
    <>
      <output>{count}</output>
      <button type="button" onClick={addThree}>+3</button>
    </>
  );
}`,
          explanation: [
            "setCount(count + 1)을 세 번 쓰면 같은 렌더의 count를 세 번 참조해 기대와 다를 수 있습니다.",
            "상태로부터 계산 가능한 값은 별도 state로 중복 저장하지 말고 렌더 중 계산합니다.",
          ],
        },
        result: {
          label: "상태 전이",
          output: `0 -> 클릭 -> 3 -> 클릭 -> 6`,
        },
      },
      {
        id: "immutable-list",
        title: "객체와 배열은 새 값으로 교체한다",
        paragraphs: [
          "React는 이전 state와 다음 state의 참조를 비교해 변경을 판단합니다. 기존 배열에 push하거나 객체 필드를 직접 바꾸면 같은 참조가 남아 재렌더 최적화가 깨지고 과거 상태도 함께 변할 수 있습니다.",
          "map은 한 항목을 바꾼 새 배열, filter는 항목을 뺀 새 배열, 펼침 문법은 일부 필드만 바꾼 새 객체를 만들 때 유용합니다. 이 불변(immutable) 업데이트 패턴은 시간 여행 디버깅과 메모이제이션에도 도움이 됩니다.",
        ],
        code: {
          language: "jsx",
          label: "할 일 추가·완료·삭제",
          code: `const [todos, setTodos] = useState([]);

function addTodo(text) {
  setTodos(items => [
    ...items,
    { id: crypto.randomUUID(), text, done: false }
  ]);
}

function toggleTodo(id) {
  setTodos(items => items.map(item =>
    item.id === id ? { ...item, done: !item.done } : item
  ));
}

function removeTodo(id) {
  setTodos(items => items.filter(item => item.id !== id));
}`,
          explanation: [
            "map에서 바뀌지 않은 항목은 기존 객체를 재사용하고 대상만 새 객체로 만듭니다.",
            "목록 렌더링 key에는 배열 순번보다 데이터의 안정적인 id를 사용합니다.",
          ],
        },
        result: {
          label: "렌더 결과 예",
          output: `추가: [{ text: "복습", done: false }]
체크: [{ text: "복습", done: true }]
삭제: []`,
        },
      },
      {
        id: "effect-sync",
        title: "Effect는 외부 시스템과 동기화할 때 쓴다",
        paragraphs: [
          "렌더링은 가능한 한 순수해야 합니다. 네트워크 요청, 타이머, DOM 구독처럼 React 밖의 시스템과 동기화할 때 useEffect를 사용합니다. 계산만 필요한 값을 Effect에서 다시 state로 만들면 불필요한 렌더가 한 번 더 생깁니다.",
          "의존성 배열이 없으면 매 렌더 뒤, []이면 마운트 뒤, [query]이면 query가 바뀔 때 실행됩니다. 구독·타이머는 cleanup 함수에서 해제하고, fetch 경쟁 상태는 AbortController 등으로 취소해야 오래된 응답이 최신 화면을 덮지 않습니다.",
        ],
        code: {
          language: "jsx",
          label: "검색어 변경 시 요청 취소",
          code: `useEffect(() => {
  const controller = new AbortController();

  async function load() {
    const response = await fetch(
      "/api/books?q=" + encodeURIComponent(query),
      { signal: controller.signal }
    );
    if (!response.ok) throw new Error("조회 실패");
    setBooks(await response.json());
  }

  load().catch(error => {
    if (error.name !== "AbortError") setError(error.message);
  });

  return () => controller.abort();
}, [query]);`,
          explanation: [
            "query가 바뀌면 이전 Effect cleanup이 먼저 실행되어 이전 요청을 취소합니다.",
            "Effect 안에서 쓰는 반응형 값은 의존성 배열에 포함해야 오래된 값을 참조하지 않습니다.",
          ],
        },
      },
      {
        id: "local-global-state",
        title: "상태는 가장 가까운 곳에 두고 필요할 때만 공유한다",
        paragraphs: [
          "입력창처럼 한 컴포넌트만 쓰는 값은 지역 state가 가장 단순합니다. 형제가 함께 쓰면 공통 부모로 끌어올리고, 테마처럼 깊은 트리에 널리 필요한 값은 Context를 고려합니다. 로그인 사용자나 여러 화면의 Todo처럼 독립적인 전역 저장소가 유용할 때 Zustand 같은 도구를 쓸 수 있습니다.",
          "전역 저장소가 모든 state의 기본값은 아닙니다. 서버에서 온 캐시 데이터, URL 검색 조건, 폼 입력, 앱 전역 상태는 수명과 소유자가 다릅니다. 어디에서 생성되고 누가 변경하며 새로고침 뒤 남아야 하는지를 먼저 묻습니다.",
        ],
        code: {
          language: "jsx",
          label: "작은 Zustand 저장소",
          code: `import { create } from "zustand";

export const useTodoStore = create(set => ({
  todos: [],
  add: text => set(state => ({
    todos: [...state.todos, { id: Date.now(), text, done: false }]
  })),
  toggle: id => set(state => ({
    todos: state.todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    )
  }))
}));

// 컴포넌트는 필요한 조각만 선택
const remaining = useTodoStore(state =>
  state.todos.filter(todo => !todo.done).length
);`,
          explanation: [
            "selector로 필요한 조각만 구독하면 무관한 상태 변경의 재렌더를 줄일 수 있습니다.",
            "localStorage persist에는 비밀 토큰 같은 민감 정보를 무심코 넣지 않습니다.",
          ],
        },
        tip: "렌더 중 state를 설정하거나 Effect가 자신이 바꾸는 state에 무조건 의존하면 무한 렌더가 생길 수 있습니다. 데이터 흐름을 먼저 그려 보세요.",
      },
    ],
    checkpoints: [
      "props와 state의 소유자·변경 방식 차이를 설명할 수 있다.",
      "일반 변수 증가가 화면에 반영되지 않는 이유를 말할 수 있다.",
      "배열의 추가·수정·삭제를 불변 업데이트로 구현할 수 있다.",
      "useEffect가 필요한 동기화와 렌더 중 계산을 구분할 수 있다.",
      "지역 state, Context, Zustand 중 상태 범위에 맞는 도구를 고를 수 있다.",
    ],
    related: ["jwt-auth-flow", "github-actions-docker-aws", "spring-mvc-request-flow"],
    sources: [
      {
        label: "React state 실습",
        repository: "https://github.com/notetester/REACT",
        path: "code/react/01-basics-my-app01/src/pages/step03-state/NumberCount.jsx",
        note: "공개 저장소에서 일반 변수와 재렌더 차이를 확인한 예제",
      },
      {
        label: "React props 실습",
        repository: "https://github.com/notetester/REACT",
        path: "code/react/01-basics-my-app01/src/pages/step09-props/ProfileSample.jsx",
        note: "부모에서 자식으로 흐르는 props 예제",
      },
      {
        label: "Zustand Todo 저장소",
        repository: "https://github.com/notetester/REACT",
        path: "code/react/02-zustand-my-app02/src/store/useTodoStore.jsx",
        note: "불변 업데이트와 persist 학습자료",
      },
    ],
  },
  {
    slug: "jwt-auth-flow",
    track: "frontend-devops",
    order: 2,
    title: "React와 Spring의 JWT 인증 흐름",
    eyebrow: "로그인, 보호 요청, 만료, 재발급까지",
    summary:
      "Access Token과 Refresh Token이 발급되고 Authorization 헤더와 Spring Security 필터를 거쳐 재발급되는 전체 왕복을 추적합니다.",
    level: "실전",
    duration: "55분",
    why:
      "로그인 화면만 통과했다고 인증이 완성되는 것은 아닙니다. 토큰 서명 검증, 만료 처리, 서버 측 권한 확인, 안전한 저장과 로그아웃까지 이어져야 보호 자원에 대한 신뢰가 만들어집니다.",
    prerequisites: [
      "HTTP 헤더와 200·401·403 상태 코드",
      "React state와 Axios 또는 fetch 비동기 요청",
      "Spring MVC Controller와 필터 체인의 기본 흐름",
      "비밀번호는 평문이 아니라 단방향 해시로 검증한다는 원칙",
    ],
    keywords: ["JWT", "Bearer", "Access Token", "Refresh Token", "SecurityContext", "rotation", "401"],
    sections: [
      {
        id: "jwt-shape",
        title: "JWT는 암호문이 아니라 서명된 주장이다",
        paragraphs: [
          "JWT(JSON Web Token)는 header.payload.signature 세 부분을 점으로 연결한 토큰 형식입니다. payload의 claim(주장)에는 subject, 발급 시각, 만료 시각 같은 정보가 들어갑니다. 일반적인 서명 JWT의 payload는 Base64URL 인코딩일 뿐 암호화되지 않아 누구나 읽을 수 있습니다.",
          "서명은 서버의 키 없이 payload를 바꾸지 못하게 무결성을 검증합니다. 따라서 비밀번호·주민번호·비밀키를 claim에 넣지 않습니다. 서버는 서명뿐 아니라 만료, 발급자, 대상, 토큰 종류를 정책에 맞게 검증해야 합니다.",
        ],
        code: {
          language: "text",
          label: "토큰의 논리 구조",
          code: `header:  { "alg": "HS256", "typ": "JWT" }
payload: { "sub": "user-42", "iat": 1783656000, "exp": 1783656900 }
signature: HMACSHA256(base64url(header) + "." + base64url(payload), secret)

Authorization: Bearer eyJ...sanitized...abc`,
          explanation: [
            "sub는 subject로, 토큰이 가리키는 사용자 식별자입니다.",
            "예시 토큰은 형식을 보여 주기 위한 값이며 실제 인증에 사용할 수 없습니다.",
          ],
        },
        tip: "JWT 문자열, Authorization 헤더, Refresh Token을 로그에 출력하지 마세요. 로그 수집 시스템과 오류 화면을 통해 유출될 수 있습니다.",
      },
      {
        id: "login-issue",
        title: "로그인은 자격 증명을 확인한 뒤 토큰을 발급한다",
        paragraphs: [
          "클라이언트가 아이디와 비밀번호를 TLS(HTTPS)로 보내면 서버는 저장된 비밀번호 해시와 비교합니다. 성공하면 짧은 수명의 Access Token과 더 긴 수명의 Refresh Token을 발급합니다.",
          "Access Token은 매 API 요청의 인증에 쓰고, Refresh Token은 Access Token 재발급에만 씁니다. Refresh Token을 DB나 안전한 저장소에 해시 형태로 보관하면 로그아웃·탈취 대응·세션 철회를 구현할 수 있습니다.",
        ],
        code: {
          language: "java",
          label: "로그인 응답의 핵심",
          code: `@PostMapping("/login")
LoginResponse login(@RequestBody LoginRequest request) {
    Member member = memberService.findByLoginId(request.loginId());
    if (!passwordEncoder.matches(request.password(), member.passwordHash())) {
        throw new BadCredentialsException("로그인 정보가 올바르지 않습니다.");
    }

    String access = tokenService.issueAccess(member.id());
    String refresh = tokenService.issueAndStoreRefresh(member.id());
    return new LoginResponse(access, refresh, MemberView.from(member));
}`,
          explanation: [
            "존재하지 않는 아이디와 틀린 비밀번호에 같은 외부 메시지를 쓰면 계정 존재 여부 노출을 줄일 수 있습니다.",
            "응답 DTO에서 passwordHash 같은 내부 필드는 반드시 제외합니다.",
          ],
        },
        result: {
          label: "로그인 성공 응답 예",
          output: `HTTP/1.1 200 OK
{
  "accessToken": "<short-lived-token>",
  "refreshToken": "<long-lived-token>",
  "user": { "id": "user-42", "name": "학습자" }
}`,
          explanation: "운영 설계에서는 Refresh Token을 HttpOnly Secure 쿠키로 보내 JavaScript 접근을 막는 방식도 자주 사용합니다.",
        },
      },
      {
        id: "bearer-filter",
        title: "보호 요청은 필터에서 검증하고 SecurityContext에 저장한다",
        paragraphs: [
          "React의 HTTP 클라이언트는 보호 API 요청에 Authorization: Bearer 토큰 헤더를 붙입니다. Spring Security의 OncePerRequestFilter는 요청마다 한 번 토큰을 꺼내 검증하고, 성공하면 Authentication을 SecurityContext에 넣습니다.",
          "인증(authentication)은 ‘누구인가’를 확인하고, 인가(authorization)는 ‘이 사용자가 이 작업을 해도 되는가’를 판단합니다. 유효한 토큰이라도 관리자 API에는 역할 확인이 추가로 필요합니다. 토큰이 없거나 잘못되면 401, 신원은 확인됐지만 권한이 없으면 403이 일반적입니다.",
        ],
        code: {
          language: "java",
          label: "Bearer 토큰 필터의 최소 흐름",
          code: `String header = request.getHeader("Authorization");

if (header != null && header.startsWith("Bearer ")) {
    String token = header.substring(7);
    TokenClaims claims = tokenService.verify(token);

    var authentication = new UsernamePasswordAuthenticationToken(
        claims.subject(), null, claims.authorities()
    );
    SecurityContextHolder.getContext().setAuthentication(authentication);
}

filterChain.doFilter(request, response);`,
          explanation: [
            "verify는 서명·만료·발급자·토큰 종류를 검증하고 실패 시 인증 예외를 내야 합니다.",
            "필터는 토큰 원문을 로그에 기록하지 않습니다.",
          ],
        },
        result: {
          label: "마이페이지 요청 흐름",
          output: `GET /members/myPage + Bearer token
-> JWT filter verifies token
-> SecurityContext principal = user-42
-> Controller loads user-42
-> 200 OK`,
        },
      },
      {
        id: "refresh-rotation",
        title: "401 뒤 재발급은 한 번만 수행하고 토큰을 회전한다",
        paragraphs: [
          "Access Token이 만료되면 서버는 401을 반환합니다. 클라이언트는 Refresh Token으로 /refresh를 한 번 호출하고 새 Access Token을 받은 뒤 원래 요청을 재시도합니다. Refresh 요청 자체가 401이면 재로그인해야 하며 무한 재시도를 막아야 합니다.",
          "여러 요청이 동시에 401을 받으면 재발급도 여러 번 경쟁할 수 있습니다. isRefreshing 잠금과 대기 큐로 한 요청만 재발급하고 나머지는 결과를 기다리게 합니다. Refresh Token rotation은 사용할 때마다 기존 토큰을 폐기하고 새 토큰을 저장하는 방식입니다.",
        ],
        code: {
          language: "javascript",
          label: "Axios 재발급 흐름의 핵심",
          code: `api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      throw error;
    }

    original._retry = true;
    const tokens = tokenStore.read();
    const response = await api.post("/members/refresh", {
      refreshToken: tokens.refreshToken
    });

    tokenStore.replace(response.data.accessToken, response.data.refreshToken);
    original.headers.Authorization =
      "Bearer " + response.data.accessToken;
    return api(original);
  }
);`,
          explanation: [
            "실전 구현에는 동시 요청 잠금, refresh/logout 경로 제외, 실패 시 큐 거절 처리가 더 필요합니다.",
            "Refresh Token을 HttpOnly 쿠키로 쓰면 body에 넣지 않고 쿠키 정책과 CSRF 방어를 함께 설계합니다.",
          ],
        },
        result: {
          label: "만료 뒤 사용자 경험",
          output: `보호 API -> 401
/refresh -> 200 + 새 토큰 쌍
원래 보호 API 재시도 -> 200`,
        },
      },
      {
        id: "jwt-security-boundary",
        title: "저장 위치와 위협 모델을 함께 결정한다",
        paragraphs: [
          "localStorage는 구현이 쉽지만 페이지에서 실행된 JavaScript가 읽을 수 있어 XSS에 취약합니다. HttpOnly Secure SameSite 쿠키는 JavaScript 접근을 막지만 브라우저가 자동 전송하므로 CSRF를 고려해야 합니다. 정답 하나가 아니라 애플리케이션의 위협 모델과 배포 도메인에 맞게 선택합니다.",
          "클라이언트의 PrivateRoute는 화면 전환을 돕는 UX 기능일 뿐 보안 경계가 아닙니다. 공격자는 브라우저 UI를 우회해 API를 직접 호출할 수 있으므로 모든 보호 API는 서버에서 인증과 권한을 다시 확인해야 합니다.",
        ],
        bullets: [
          "Access Token은 짧게, Refresh Token은 회전·철회 가능하게 설계합니다.",
          "서명키는 충분히 길고 무작위인 값을 비밀 저장소에서 주입하며 저장소에 커밋하지 않습니다.",
          "로그아웃 시 서버 저장 Refresh Token을 폐기하고 클라이언트 토큰도 제거합니다.",
          "CORS 허용 출처를 *로 넓히지 말고 실제 프런트엔드 출처로 제한합니다.",
          "JWT payload의 사용자 역할이 변경될 때 기존 토큰의 효력을 어떻게 다룰지 정책을 정합니다.",
        ],
      },
    ],
    checkpoints: [
      "JWT payload가 암호화된 비밀이 아닌 이유를 설명할 수 있다.",
      "로그인부터 Access·Refresh Token 발급까지 서버 동작을 순서대로 말할 수 있다.",
      "Bearer 요청이 필터와 SecurityContext를 통과하는 경로를 추적할 수 있다.",
      "401과 403의 차이, 재발급 무한 루프를 막는 조건을 설명할 수 있다.",
      "localStorage와 HttpOnly 쿠키의 XSS·CSRF trade-off를 비교할 수 있다.",
    ],
    related: ["react-components-state", "spring-boot-autoconfiguration", "github-actions-docker-aws"],
    sources: [
      {
        label: "React 인증 API 학습자료",
        repository: "https://github.com/notetester/REACT",
        path: "code/react/03-integration-my-app03/src/api/Auth.jsx",
        note: "공개 저장소의 요청 인터셉터 구조와 인증 API 함수",
      },
      {
        label: "Spring JWT 필터 원본",
        repository: "https://github.com/notetester/REACT",
        path: "code/springboot/02-integration-MyProject02/src/main/java/com/study/myproject02/common/jwt/JwtRequestFilter.java",
        note: "공개 저장소의 Bearer 검증 흐름을 토큰 로그 없이 설명",
      },
      {
        label: "React 자동 재발급 원본",
        repository: "https://github.com/notetester/REACT",
        path: "docs/integration/react-springboot-jwt-flow.md",
        note: "공개 문서의 401 재시도와 Refresh Token 흐름",
      },
    ],
  },
  {
    slug: "github-actions-docker-aws",
    track: "frontend-devops",
    order: 3,
    title: "GitHub Actions → Docker Hub → AWS 배포",
    eyebrow: "커밋을 검증 가능한 실행물로 전달하기",
    summary:
      "push를 시작점으로 테스트, Docker 이미지 빌드·푸시, EC2 교체와 롤백까지 CI/CD 파이프라인을 단계별로 구성합니다.",
    level: "실전",
    duration: "60분",
    why:
      "수동 배포는 누가 어떤 명령을 실행했는지 재현하기 어렵고 실수하기 쉽습니다. 파이프라인은 같은 커밋을 같은 절차로 검증하고, 식별 가능한 이미지로 만들어, 승인된 환경에 전달하는 실행 문서입니다.",
    prerequisites: [
      "Git commit·branch·push와 커밋 SHA의 의미",
      "React production build 또는 Spring Boot jar 빌드 경험",
      "서버의 포트, 프로세스, 환경변수 기본 개념",
      "AWS EC2에 SSH로 접속하고 보안 그룹이 포트를 허용한다는 개념",
    ],
    keywords: ["CI", "CD", "workflow", "runner", "Docker image", "registry", "EC2", "rollback"],
    sections: [
      {
        id: "pipeline-map",
        title: "CI는 검증, CD는 전달과 배포다",
        paragraphs: [
          "CI(Continuous Integration)는 작은 변경을 자주 합치고 자동 빌드·테스트로 통합 가능성을 확인하는 과정입니다. CD는 통과한 산출물을 배포 가능한 상태로 전달(Delivery)하거나 실제 환경까지 자동 배포(Deployment)하는 흐름입니다.",
          "GitHub Actions의 workflow는 .github/workflows 아래 YAML 파일이고, event가 실행 시점을 정합니다. job은 runner라는 깨끗한 실행 환경에서 돌며 기본적으로 서로 독립적입니다. step은 셸 명령 또는 재사용 action 한 번입니다.",
        ],
        code: {
          language: "text",
          label: "커밋이 운영으로 가는 경로",
          code: `git push main
  -> GitHub Actions runner
  -> checkout
  -> dependency install
  -> lint + test + production build
  -> docker build (tag = commit SHA)
  -> Docker Hub push
  -> EC2 pulls exact SHA tag
  -> health check
  -> traffic switch / old container cleanup`,
        },
        result: {
          label: "추적 가능한 배포",
          output: `commit: a1b2c3d...
image: example/study-app:a1b2c3d...
server container: study-app-a1b2c3d`,
          explanation: "커밋 SHA 태그를 쓰면 어떤 코드가 실행 중인지 역추적하고 이전 SHA로 롤백하기 쉽습니다.",
        },
      },
      {
        id: "actions-workflow",
        title: "테스트를 통과한 커밋만 이미지로 만든다",
        paragraphs: [
          "workflow는 최소 권한을 명시하고, 의존성을 lockfile대로 설치한 뒤 테스트와 빌드를 통과해야 다음 단계로 갑니다. 실제 배포에서는 action 버전을 검토된 커밋 SHA로 고정하면 공급망 변경 위험을 더 줄일 수 있습니다.",
          "비밀값은 GitHub Actions secrets나 환경별 secret에 저장하고 YAML에는 이름만 참조합니다. echo로 비밀을 출력하거나 set -x를 켜지 않습니다. pull_request에서는 외부 기여 코드에 배포 비밀을 넘기지 않도록 트리거와 권한을 분리합니다.",
        ],
        code: {
          language: "yaml",
          label: "검증 후 Docker Hub에 푸시",
          code: `name: build-and-publish
on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: gradle
      - run: chmod +x gradlew
      - run: ./gradlew test bootJar
      - uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_TOKEN }}
      - run: |
          IMAGE=\${{ secrets.DOCKER_USERNAME }}/study-app
          docker build -t "$IMAGE:\${{ github.sha }}" .
          docker push "$IMAGE:\${{ github.sha }}"`,
          explanation: [
            "-x test로 테스트를 빼면 CI의 핵심 안전망이 사라집니다.",
            "Docker Hub 비밀번호 대신 범위를 제한한 access token을 secret으로 사용합니다.",
          ],
        },
        result: {
          label: "실패 전파",
          output: `test 실패 -> job 중단 -> image push 없음 -> deploy 없음
모두 성공 -> SHA 태그 image 1개 게시`,
        },
      },
      {
        id: "docker-image",
        title: "Docker 이미지는 실행 환경까지 포함한 불변 산출물이다",
        paragraphs: [
          "Dockerfile의 각 명령은 이미지 레이어를 만듭니다. 이미지는 읽기 전용 설계도이고 container는 그 이미지를 실행한 인스턴스입니다. 같은 이미지 digest를 개발과 운영에서 실행하면 ‘내 컴퓨터에서는 됐는데’ 차이를 줄일 수 있습니다.",
          "멀티스테이지 빌드는 컴파일 도구가 든 build 단계와 실행에 필요한 파일만 든 runtime 단계를 분리합니다. React는 Node에서 빌드한 정적 파일을 Nginx로 제공하고, Spring은 Gradle에서 만든 jar를 더 작은 JRE 이미지로 실행할 수 있습니다.",
        ],
        code: {
          language: "dockerfile",
          label: "Spring Boot 멀티스테이지 이미지",
          code: `FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon
COPY src ./src
RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 appuser
COPY --from=build /workspace/build/libs/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]`,
          explanation: [
            "최종 단계에는 소스·Gradle·JDK 대신 실행 jar와 JRE만 남습니다.",
            "root가 아닌 사용자로 실행하면 컨테이너 침해 시 권한을 줄일 수 있습니다.",
          ],
        },
        result: {
          label: "로컬 확인",
          output: `docker build -t study-app:local .
docker run --rm -p 8080:8080 --env-file .env.local study-app:local
curl -f http://localhost:8080/actuator/health`,
          explanation: ".env.local은 Git에 커밋하지 않고 예제 파일에는 키 이름만 둡니다.",
        },
      },
      {
        id: "ec2-deploy",
        title: "EC2는 정확한 태그를 받아 health check 뒤 교체한다",
        paragraphs: [
          "단순한 학습 배포에서는 Actions가 SSH로 EC2에 접속해 새 이미지를 pull하고 container를 교체할 수 있습니다. latest 대신 커밋 SHA를 전달해야 재현성과 롤백이 생깁니다. 환경변수 파일과 SSH 키는 이미지에 굽지 않고 서버나 비밀 관리 서비스에서 주입합니다.",
          "기존 container를 먼저 지우면 새 버전이 시작 실패할 때 서비스가 중단됩니다. 새 container를 다른 포트에서 먼저 실행하고 health check가 성공한 뒤 reverse proxy 대상을 바꾸는 blue/green 방식이 더 안전합니다. 아래는 흐름을 이해하기 위한 단순 교체 예이며 무중단 운영에는 앞단 프록시가 필요합니다.",
        ],
        code: {
          language: "bash",
          label: "SHA 태그 배포와 실패 시 정리",
          code: `set -eu
IMAGE="example/study-app:\${IMAGE_TAG}"
NEW="study-app-\${IMAGE_TAG}"

docker pull "$IMAGE"
docker run -d --name "$NEW" \
  --env-file /opt/study-app/runtime.env \
  -p 18080:8080 "$IMAGE"

for i in 1 2 3 4 5; do
  if curl -fsS http://127.0.0.1:18080/actuator/health; then
    echo "new container healthy"
    exit 0
  fi
  sleep 3
done

docker logs --tail 100 "$NEW"
docker rm -f "$NEW"
exit 1`,
          explanation: [
            "IMAGE_TAG는 workflow가 전달한 github.sha처럼 검증된 값만 사용합니다.",
            "health check 실패 시 새 container만 제거하고 기존 서비스는 유지합니다.",
          ],
        },
        result: {
          label: "성공 조건",
          output: `image pull 성공
container process 실행 중
/actuator/health -> HTTP 200
그 뒤에만 트래픽 전환`,
        },
      },
      {
        id: "rollback-and-hardening",
        title: "배포 성공은 health check와 롤백까지 포함한다",
        paragraphs: [
          "workflow가 초록색이어도 사용자가 실제 기능을 쓸 수 있다는 보장은 없습니다. 서버 내부 health check, 외부 URL smoke test, 로그와 지표 관찰을 배포 성공 조건에 포함하세요. DB 마이그레이션은 이전 애플리케이션과 잠시 공존할 수 있도록 하위 호환 순서로 설계해야 합니다.",
          "롤백은 이전에 정상 동작한 SHA 이미지로 다시 트래픽을 돌리는 절차입니다. 배포 때마다 이전 SHA와 변경 내용을 기록하고 정기적으로 복구 절차를 연습해야 합니다. 이미지를 되돌려도 비가역 DB 변경은 남으므로 schema migration 전략이 별도로 필요합니다.",
        ],
        bullets: [
          "Actions와 Docker base image 버전을 주기적으로 갱신하고 취약점 스캔 결과를 확인합니다.",
          "EC2 보안 그룹은 필요한 포트와 출발지로 제한하고 SSH보다 배포 전용 역할·세션 관리 도구를 검토합니다.",
          "container 로그에 환경변수 전체나 토큰을 출력하지 않습니다.",
          "동일 브랜치의 이전 배포가 늦게 끝나 새 배포를 덮지 않도록 concurrency를 설정합니다.",
          "운영 배포에는 GitHub Environment 승인과 보호 규칙을 둘 수 있습니다.",
        ],
        tip: "‘빌드 성공’과 ‘배포 성공’과 ‘서비스 정상’은 서로 다른 검사입니다. 각 단계의 증거를 따로 남기세요.",
      },
    ],
    checkpoints: [
      "CI와 자동 배포의 목적을 build-test-publish-deploy 단계로 구분할 수 있다.",
      "workflow의 event, job, runner, step을 실제 YAML에서 찾을 수 있다.",
      "멀티스테이지 Dockerfile이 최종 이미지 크기와 공격 표면을 줄이는 이유를 설명할 수 있다.",
      "커밋 SHA 이미지 태그가 latest보다 롤백에 유리한 이유를 말할 수 있다.",
      "health check 실패 때 기존 서비스를 보존하는 배포 순서를 설계할 수 있다.",
      "비밀값을 저장소·이미지·로그에 남기지 않고 주입할 수 있다.",
    ],
    related: ["spring-boot-autoconfiguration", "react-components-state", "jwt-auth-flow"],
    sources: [
      {
        label: "공개 학습 사이트 CI workflow",
        repository: "https://github.com/notetester/REACT",
        path: ".github/workflows/ci.yml",
        note: "공개 저장소의 checkout, install, 검증, build 단계",
      },
      {
        label: "AWS 컨테이너 배포 안내",
        repository: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-basics.html",
        note: "AWS 공식 문서의 이미지·컨테이너 기본 흐름",
      },
      {
        label: "GitHub Actions 공식 workflow 문서",
        repository: "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax",
        note: "트리거, job, 권한, secrets 문법 확인",
      },
      {
        label: "Docker 공식 멀티스테이지 빌드 문서",
        repository: "https://docs.docker.com/build/building/multi-stage/",
        note: "build stage와 runtime stage 분리 원칙",
      },
    ],
  },
];
