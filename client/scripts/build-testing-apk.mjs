import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const client = fileURLToPath(new URL('../', import.meta.url));
const android = path.join(client, 'android');
const output = path.resolve(client, '../artifacts/GuimarasGo-testing.apk');
const metadataPath = path.resolve(client, '../artifacts/GuimarasGo-testing.json');
const previousBuild = existsSync(metadataPath) ? JSON.parse(readFileSync(metadataPath, 'utf8')).versionCode : 5;
const buildNumber = previousBuild + 1;
if (!Number.isSafeInteger(buildNumber) || buildNumber < 6 || buildNumber > 2147483647) {
    throw new Error('The testing APK build metadata has an invalid versionCode.');
}
const versionedOutput = path.resolve(client, `../artifacts/GuimarasGo-testing-${buildNumber}.apk`);

if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT && !existsSync(path.join(android, 'local.properties'))) {
    console.error('Set ANDROID_HOME to your Android SDK directory before building the testing APK. Java 21 is also required.');
    process.exit(1);
}

const env = {
    ...process.env,
    VITE_CLIENT_PREVIEW: 'true',
    VITE_STAFF_PREVIEW: 'true',
    VITE_ADMIN_PREVIEW: 'true',
    VITE_TEST_APK: 'true',
    VITE_TEST_BUILD: String(buildNumber),
};

function run(command, args, cwd = client) {
    const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Building GuimarasGo Test · Build ${buildNumber}`);
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android']);
const gradleArgs = ['--no-daemon', '-PclientPreview=true', `-PpreviewBuildNumber=${buildNumber}`, ':app:assembleDebug'];
if (process.platform === 'win32') {
    run('cmd.exe', ['/c', 'gradlew.bat', ...gradleArgs], android);
} else {
    run('sh', ['gradlew', ...gradleArgs], android);
}
mkdirSync(path.dirname(output), { recursive: true });
const compiled = path.join(android, 'app/build/outputs/apk/debug/app-debug.apk');
for (const destination of [versionedOutput, output]) {
    copyFileSync(compiled, `${destination}.tmp`);
    renameSync(`${destination}.tmp`, destination);
}
const nativeMetadata = JSON.parse(readFileSync(path.join(android, 'app/build/outputs/apk/debug/output-metadata.json'), 'utf8'));
const apk = readFileSync(output);
writeFileSync(metadataPath, `${JSON.stringify({
    applicationId: nativeMetadata.applicationId,
    versionCode: nativeMetadata.elements[0].versionCode,
    versionName: nativeMetadata.elements[0].versionName,
    buildLabel: `GuimarasGo Test · Build ${buildNumber}`,
    file: path.basename(versionedOutput),
    builtAt: new Date().toISOString(),
    bytes: apk.length,
    sha256: createHash('sha256').update(apk).digest('hex'),
}, null, 2)}\n`);
console.log(`\nTesting APK: ${versionedOutput}\nLatest APK: ${output}`);
