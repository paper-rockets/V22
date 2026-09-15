# The AndroidX test runner pulls this annotation type through Error Prone's
# metadata. It is not part of the runtime APK and is safe to omit from the
# minified instrumentation test artifact.
-dontwarn javax.lang.model.element.Modifier
