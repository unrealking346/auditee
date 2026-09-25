package com.waeve.mobile.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val WaeveBlue = Color(0xFF1687FF)
private val WaeveBlack = Color(0xFF000000)
private val WaeveBackground = Color(0xFF07080B)
private val WaeveSurface = Color(0xFF111318)

private val DarkColors = darkColorScheme(
    primary = WaeveBlue,
    onPrimary = WaeveBlack,
    background = WaeveBackground,
    surface = WaeveSurface,
    onBackground = Color(0xFFF4F5F7),
    onSurface = Color(0xFFF4F5F7)
)

@Composable fun WaeveTheme(content: @Composable () -> Unit) { MaterialTheme(colorScheme = DarkColors, typography = Typography(), content = content) }
