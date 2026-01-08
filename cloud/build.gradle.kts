plugins {
	id("java")
	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.google.cloud.tools.jib") version "3.4.5"
}

group = "com.datix"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
	runtimeOnly("com.h2database:h2")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	//Lombok
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
}

jib {
	container {
		mainClass = "com.datix.coresystem_poc.CoresystemPocApplication"
		creationTime = "USE_CURRENT_TIMESTAMP"
	}
	from {
		image = "eclipse-temurin:23-jdk"
	}
	to {
		image = "coresystem-poc"
	}
}
tasks.withType<Test> {
	useJUnitPlatform()
}

val copyPublicResources by tasks.registering(Copy::class) {
	from("./angularclient/dist/angularclient/browser/")
	into("./src/main/resources/static/")
	dependsOn(":angularclient:buildApp")
}

tasks.named("processResources") {
	dependsOn(copyPublicResources)
}