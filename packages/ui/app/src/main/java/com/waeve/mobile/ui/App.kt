package com.waeve.mobile.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.waeve.mobile.data.WaeveApi
import com.waeve.mobile.data.WaeveSession
import com.waeve.mobile.model.Playlist
import com.waeve.mobile.model.Song
import com.waeve.mobile.player.WaevePlayer
import com.waeve.mobile.ui.theme.WaeveTheme
import kotlinx.coroutines.launch

@Composable
fun WaeveApp(session: WaeveSession, api: WaeveApi, player: WaevePlayer) {
    WaeveTheme {
        val nav = rememberNavController()
        NavHost(nav, startDestination = if (session.isAuthenticated()) "home" else "auth") {
            composable("auth") { AuthScreen(session, api) { nav.navigate("home") { popUpTo("auth") { inclusive = true } } } }
            composable("home") { HomeScreen(api, player, nav) }
            composable("search") { SearchScreen(api, player) }
            composable("library") { LibraryScreen(api, player, nav) }
            composable("profile") { ProfileScreen(session) { session.clear(); nav.navigate("auth") { popUpTo(0) } } }
            composable("premium") { PremiumScreen(api) }
        }
    }
}

@Composable private fun Shell(title: String, nav: NavHostController, content: @Composable ColumnScope.() -> Unit) {
    Scaffold(bottomBar = {
        NavigationBar(containerColor = Color(0xFF0B0C10)) {
            NavItem(Icons.Default.Home, "Home", title == "Home") { nav.navigate("home") }
            NavItem(Icons.Default.Search, "Search", title == "Search") { nav.navigate("search") }
            NavItem(Icons.Default.LibraryMusic, "Library", title == "Library") { nav.navigate("library") }
            NavItem(Icons.Default.Person, "Profile", title == "Profile") { nav.navigate("profile") }
        }
    }) { p -> Column(Modifier.padding(p).fillMaxSize().background(Color(0xFF07080B)), content = content) }
}

@Composable private fun NavItem(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    NavigationBarItem(selected = selected, onClick = onClick, icon = { Icon(icon, null) }, label = { Text(label) })
}

@Composable private fun HomeScreen(api: WaeveApi, player: WaevePlayer, nav: NavHostController) {
    var recent by remember { mutableStateOf(emptyList<Song>()) }
    var recommended by remember { mutableStateOf(emptyList<Song>()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { runCatching { api.home() }.onSuccess { recent = it.first; recommended = it.second }.also { loading = false } }
    Shell("Home", nav) {
        Header("Good evening", "Discover your next wave")
        if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        Section("Made for you", recommended, player)
        Section("Recently played", recent, player)
        Section("Global discovery", (recommended + recent).distinctBy { it.id }.take(12), player)
        Spacer(Modifier.height(24.dp))
    }
}

@Composable private fun Header(title: String, subtitle: String) {
    Column(Modifier.padding(horizontal = 20.dp, vertical = 18.dp)) { Text(title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold); Text(subtitle, color = Color(0xFF9EA4AF)) }
}

@Composable private fun Section(title: String, songs: List<Song>, player: WaevePlayer) {
    if (songs.isEmpty()) return
    val scope = rememberCoroutineScope()
    Column(Modifier.padding(bottom = 20.dp)) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp))
        LazyColumn(Modifier.heightIn(max = 500.dp), contentPadding = PaddingValues(horizontal = 12.dp)) { items(songs) { SongRow(it) { scope.launch { player.play(it) } } } }
    }
}

@Composable private fun SongRow(song: Song, onPlay: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onPlay).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(56.dp).clip(RoundedCornerShape(10.dp)).background(Brush.linearGradient(listOf(Color(0xFF1687FF), Color(0xFF101216)))))
        Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(song.title, fontWeight = FontWeight.SemiBold); Text(song.artistName, color = Color(0xFF9EA4AF), maxLines = 1) }
        IconButton(onClick = onPlay) { Icon(Icons.Default.PlayArrow, "Play") }
    }
}

@Composable private fun SearchScreen(api: WaeveApi, player: WaevePlayer) {
    var q by remember { mutableStateOf("") }; var songs by remember { mutableStateOf(emptyList<Song>()) }; val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize().background(Color(0xFF07080B)).padding(20.dp)) {
        Text("Search", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(q, { q = it }, Modifier.fillMaxWidth(), placeholder = { Text("Songs, artists, albums, playlists") }, singleLine = true, leadingIcon = { Icon(Icons.Default.Search, null) }, trailingIcon = { if (q.isNotBlank()) IconButton({ scope.launch { songs = api.searchSongs(q) } }) { Icon(Icons.Default.ArrowForward, "Search") } })
        Spacer(Modifier.height(16.dp)); LazyColumn { items(songs) { SongRow(it) { scope.launch { player.play(it) } } } }
    }
}

@Composable private fun LibraryScreen(api: WaeveApi, player: WaevePlayer, nav: NavHostController) {
    var playlists by remember { mutableStateOf(emptyList<Playlist>()) }; var show by remember { mutableStateOf(false) }; var name by remember { mutableStateOf("") }; val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { runCatching { playlists = api.playlists() } }
    Shell("Library", nav) {
        Row(Modifier.fillMaxWidth().padding(20.dp), verticalAlignment = Alignment.CenterVertically) { Text("Your Library", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, Modifier.weight(1f)); IconButton({ show = true }) { Icon(Icons.Default.Add, "Create playlist") } }
        LazyColumn { item { Text("Playlists", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(20.dp)) }; items(playlists) { p -> ListItem(headlineContent = { Text(p.name) }, supportingContent = { Text(if (p.collaborative) "Collaborative" else p.visibility) }, leadingContent = { Icon(Icons.Default.QueueMusic, null) }) } }
        if (show) AlertDialog(onDismissRequest = { show = false }, title = { Text("New playlist") }, text = { OutlinedTextField(name, { name = it }, label = { Text("Playlist name") }) }, confirmButton = { Button({ scope.launch { api.createPlaylist(name, false); playlists = api.playlists(); show = false; name = "" } }) { Text("Create") } }, dismissButton = { TextButton({ show = false }) { Text("Cancel") } })
    }
}

@Composable private fun ProfileScreen(session: WaeveSession, logout: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Color(0xFF07080B)).padding(24.dp)) { Text("WAEVE", style = MaterialTheme.typography.labelLarge, color = Color(0xFF1687FF)); Spacer(Modifier.height(12.dp)); Text(session.user?.displayName ?: "Listener", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold); Text(session.user?.email.orEmpty(), color = Color.Gray); Spacer(Modifier.height(28.dp)); ListItem(headlineContent = { Text("Listening statistics") }, leadingContent = { Icon(Icons.Default.BarChart, null) }); ListItem(headlineContent = { Text("Subscription") }, leadingContent = { Icon(Icons.Default.Star, null) }); ListItem(headlineContent = { Text("Privacy & security") }, leadingContent = { Icon(Icons.Default.Security, null) }); Spacer(Modifier.weight(1f)); Button(onClick = logout, modifier = Modifier.fillMaxWidth()) { Text("Log out") } }
}

@Composable private fun PremiumScreen(api: WaeveApi) { Column(Modifier.fillMaxSize().background(Color(0xFF07080B)).padding(24.dp)) { Text("WAEVE Premium", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold); Text("Ad-free listening • offline downloads • higher quality", color = Color.Gray); Spacer(Modifier.height(24.dp)); Button(onClick = { /* Billing provider integration boundary */ }, modifier = Modifier.fillMaxWidth()) { Text("Start first month free") }; Text("Billing is routed through the platform billing provider in production.", color = Color.Gray, modifier = Modifier.padding(top = 16.dp)) } }

@Composable private fun AuthScreen(session: WaeveSession, api: WaeveApi, onSuccess: () -> Unit) {
    var register by remember { mutableStateOf(false) }; var email by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; var username by remember { mutableStateOf("") }; var displayName by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; var busy by remember { mutableStateOf(false) }; val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize().background(Color(0xFF07080B)).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("WAEVE", color = Color(0xFF1687FF), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black); Text(if (register) "Create your account" else "Welcome back", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold); Spacer(Modifier.height(24.dp))
        if (register) { OutlinedTextField(displayName, { displayName = it }, Modifier.fillMaxWidth(), label = { Text("Display name") }); Spacer(Modifier.height(10.dp)); OutlinedTextField(username, { username = it }, Modifier.fillMaxWidth(), label = { Text("Username") }); Spacer(Modifier.height(10.dp)) }
        OutlinedTextField(email, { email = it }, Modifier.fillMaxWidth(), label = { Text("Email") }); Spacer(Modifier.height(10.dp)); OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("Password") }); Spacer(Modifier.height(16.dp))
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }; Spacer(Modifier.height(8.dp)); Button(enabled = !busy, onClick = { scope.launch { busy = true; error = null; runCatching { if (register) api.register(email, password, username, displayName, null, null) else api.login(email, password) }.onSuccess { session.save(it.first, it.second); onSuccess() }.onFailure { error = it.message }.also { busy = false } } }, Modifier.fillMaxWidth()) { Text(if (busy) "Please wait…" else if (register) "Create account" else "Log in") }
        TextButton({ register = !register }) { Text(if (register) "Already have an account? Log in" else "Create a new WAEVE account") }
    }
}
