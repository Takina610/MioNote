# Spring 的单例 Bean 是线程安全的吗

一般来说就是线程安全的，一般交给 Spring 管理的 Bean 都是无状态的，但如果在类里定义了可以修改的成员变量，那么这个 Bean 可能就会有线程安全问题。

# 什么是 AOP (1次)

AOP 就是面向切面编程，用于将一些与业务无关，但是在多处都使用的公共逻辑抽取出来进行封装，比如日志记录和性能监控等；
Spring AOP 的底层就是通过动态代理实现的，首先定义一个切面，再通过切点表达式和环绕通知拿到执行方法的信息。

# Spring 事务失效的场景有哪些

第一个就是代码中自己捕**获了异常，但是没有再抛出去**；
第二个就是**抛出了非受查型异常**，Spring 的事务默认是抛出检查型异常才会生效的，只需要在 @Transactional 注解加上 rollback for = Exception.clas 即可；
最后一个就是方法**不是 public 的**，Spring 的事务只有方法是 public 才会生效。

# Spring Bean 的生命周期

首先是通过 **BeanDefinition** 找到 Bean 的基本信息；
通过**构造函数**实例化 Bean；
完成 Bean 的**依赖注入**，主要是通过 setter 方法或者 @Autowired 注解注入；
执行实现了一系列 **Aware** 接口的方法；
执行 **BeanPostProcesser 的前置处理器**
执行一些**初始化的方法**，比如使用了 @PostConstruct 注解的方法
执行 **BeanPostProcesser 的后置处理器**，往往一些代理对象就在这里创建；
最后是在容器关闭后**销毁** Bean。

![](./img/Snipaste_2026-04-16_20-02-37.png)

# Spring 中的循环依赖问题

**循环依赖就是两个或两个以上的 Bean 互相引用**，例如 A 依赖于 B，B 依赖于 A；
Spring **通过三级缓存来解决**循环依赖；
**一级缓存是一个单例池**，用来缓存已经创建好的 Bean；
**二级缓存用于缓存早期的 Bean 对象**，也就是半成品；
**三级缓存缓存的是 ObjectFactories，也就是对象工厂**，这个对象工厂可以创建普通的对象，也可以创建特定的代理对象；
一级和二级缓存就已经可以解决大部分循环依赖问题了，但**如果创建的对象是代理对象，那么就需要借助三级缓存来完成**；
如果**注入的方式的是构造器，那么三级缓存也无法解决**，因为三级缓存无法从执行构造函数这一生命周期就开始工作，一般**通过在变量或成员前添加 @Lazy 注解来解决**，表示延迟加载该类。

# 谈谈对 SpringMVC 的理解以及执行流程

**SpringMVC 是 Spring 中用于 Web 开发的模块，是对传统 MVC 思想的具体实现和扩展**；
它最大的价值就是**引入了一个 DispatcherServlet**，也就是前端控制器，它是一个调度中心，所有的请求都会经过它，由它来进行指挥；

具体的执行流程是：
前端发送请求后，经过这个前端控制器，前端控制器再发送给 **HandlerMapping（处理器映射器）**；
处理器映射器将拿到的 URL 进行解析，找到需要执行对应类的对应方法；
处理器映射器再将该方法信息和一些拦截器链打包返回给前端控制器；
前端控制器拿到这些信息后再发送给 **HandlerAdapter（控制器适配器）**，用于处理参数和返回值，比如序列化和反序列化对象；
控制器适配器再交由 **Handler（处理器）** 具体执行这个方法；
执行后经过控制器适配器返回给前端控制器，最后返回给浏览器。

![](./img/Snipaste_2026-04-17_10-06-31.png)

# SpringBoot 自动配置的原理是什么

主要是基于 @SpringBootApplication 注解，这个注解里有一个 @EnableAutoConfiguration，里面通过 @Import 注解读取文件中具体的类名，再通过条件注解判断哪些 Bean 需要创建到容器。

# Spring 中的常见注解有哪些

Spring 中的常见注解有：
@Component、@Controller、@Service、@Repository、@Bean；
@Autowired 和 @Qualifier 通常搭配使用，@Autowired 按照类型进行注入，而 @Qualifier 可以将其扩展，通过名称进行注入；
@Resource 是 JDK 自带的注解，也是通过名称进行注入；
@Configuration；

SpringAOP 相关的注解有：
@Aspect、@Before、@After、@Around

SpringMVC 相关的注解有：
@RequestMapping、@GetMapping、@RequestBody、@RequestParam、@PathVariable
@RestController 是 @Controller 和 @ResponseBody 的结合版

SpringBoot 相关的注解有：
@SpringBootApplication、@EnableConfiguration、@ComponentScan

# MyBatis 的执行流程是什么

**加载 MyBatis 的全局配置文件**和对应的映射 xml 文件；
**创建 SqlSessionFactory** 工厂对象；
通过工厂对象**创建 SqlSession**；
**创建 Mapper 接口代理的对象**，通过 SqlSession 创建；
**将参数进行映射**，执行具体映射文件里的 SQL 语句；
**将返回结果映射**为对应的 Java Bean；
**关闭 SqlSession**，释放资源。

# MyBatis 支持延迟加载吗

延迟加载就是数据需要被用到时才加载，否则就不加载；
支持的，默认是关闭的，可以通过在配置文件里进行打开；
底层原理是通过 CGLIB 创建目标对象的代理对象，需要用到时再通过 invoke 调用对应的方法。

# Mybatis 的缓存机制是什么

Mybatis有两级缓存；
一级缓存是基于 PerpetualCache 的 HashMap 本地缓存，作用域是 Session，是默认开启的；
二级缓存是默认关闭的，需要在配置文件里打开，作用域是 namespace 或 mapper，也是基于 PerpetualCache 的 HashMap 本地缓存；

当作用域进行了增删改操作后，就会将本地的缓存清空。