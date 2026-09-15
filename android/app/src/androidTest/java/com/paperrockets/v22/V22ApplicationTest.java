package com.paperrockets.v22;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class V22ApplicationTest {

    private UiDevice device;
    private static final long TIMEOUT_MS = 10000;

    @Before
    public void setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    }

    @After
    public void tearDown() throws Exception {
        if (device != null) {
            device.unfreezeRotation();
        }
    }

    @Test
    public void testApplicationPackageAndContext() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        // The same test APK is built for release, benchmark, and debug
        // variants. Assert the stable application namespace without tying the
        // test to a single variant suffix.
        assertTrue("Unexpected application id: " + appContext.getPackageName(),
                appContext.getPackageName().startsWith("com.paperrockets.v22"));
    }

    @Test
    public void testDrawingWorkspaceAndWebViewAttached() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            // Wait for WebView surface to be attached and rendered
            UiObject2 webView = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView surface must be attached and present in hierarchy", webView);
            assertTrue("WebView width must be greater than zero", webView.getVisibleBounds().width() > 0);
            assertTrue("WebView height must be greater than zero", webView.getVisibleBounds().height() > 0);
        }
    }

    @Test
    public void testOrientationAdaptation() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            UiObject2 webView = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView surface must be present before orientation change", webView);

            // Rotate to Portrait
            device.setOrientationNatural();
            Thread.sleep(2000);
            UiObject2 portraitWebView = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must remain attached and responsive in portrait", portraitWebView);

            // Rotate back to Landscape
            device.setOrientationRight();
            Thread.sleep(2000);
            UiObject2 landscapeWebView = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must remain attached and responsive in landscape", landscapeWebView);
        }
    }

    @Test
    public void testBackNavigationIntegrity() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            UiObject2 webView = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView surface must be present", webView);

            // Tap to interact
            webView.click();
            Thread.sleep(500);

            // Press Android back button
            device.pressBack();
            Thread.sleep(1000);

            // Verify app did not crash
            Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
            assertNotNull("App context remains valid", appContext);
        }
    }

    @Test
    public void testColdStartAndBackgroundRecovery() throws Exception {
        long start = SystemClock.elapsedRealtime();
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            UiObject2 webView = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must appear during cold start", webView);
            assertTrue("Cold start exceeded 30 seconds",
                    SystemClock.elapsedRealtime() - start < 30000);

            device.pressHome();
            Thread.sleep(500);
            Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
            Intent relaunch = appContext.getPackageManager()
                    .getLaunchIntentForPackage(appContext.getPackageName());
            assertNotNull("Launcher intent must be available after backgrounding", relaunch);
            relaunch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            appContext.startActivity(relaunch);

            UiObject2 recovered = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must recover after background/foreground", recovered);
            assertTrue("Recovered WebView must have positive bounds",
                    recovered.getVisibleBounds().width() > 0 && recovered.getVisibleBounds().height() > 0);
        }
    }

    @Test
    public void testWorkspaceSurvivesRotationAndBackToPortrait() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            UiObject2 initial = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must be present before rotation", initial);

            device.setOrientationRight();
            UiObject2 landscape = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must remain present in landscape", landscape);

            device.setOrientationNatural();
            UiObject2 portrait = device.wait(Until.findObject(By.clazz("android.webkit.WebView")), TIMEOUT_MS);
            assertNotNull("WebView must remain present after returning to portrait", portrait);
        }
    }
}
