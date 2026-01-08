plugins {
    id("com.github.node-gradle.node") version "3.5.1" // Adjust version if needed
}

node {
    // Uncomment and set versions if needed:
    // version.set("16.12.0")
    // npmVersion.set("8.1.0")
    // download.set(true)

    workDir.set(file("${project.layout.buildDirectory}/node"))
    nodeProjectDir.set(file(project.projectDir))
}

val buildOption: String by project

tasks.register<com.github.gradle.node.npm.task.NpmTask>("buildApp") {
    args.set(listOf("run", buildOption))
    dependsOn(tasks.named("npmInstall"))
}
