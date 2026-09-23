buildscript {
    repositories {
    // 国内镜像：Maven Central 直连经常被掐断 TLS，阿里云先解析一遍
    maven { url = uri("https://maven.aliyun.com/repository/public") }
    maven { url = uri("https://maven.aliyun.com/repository/google") }
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
    }
}

allprojects {
    repositories {
    // 国内镜像：Maven Central 直连经常被掐断 TLS，阿里云先解析一遍
    maven { url = uri("https://maven.aliyun.com/repository/public") }
    maven { url = uri("https://maven.aliyun.com/repository/google") }
        google()
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

