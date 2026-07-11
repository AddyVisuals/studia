const SUPABASE_URL = "https://idewhnsdndbfgggvhfuq.supabase.co";
const SUPABASE_ANON_KEY =
    "sb_publishable_mBChC2kALj9BVq1ht0T3-w_xPIoye22";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");
const messageElement = document.getElementById("adminLoginMessage");
const loginButton = document.getElementById("adminLoginBtn");

function setMessage(message, isError = true) {
    messageElement.textContent = message;
    messageElement.style.color = isError
        ? "#ff5c6c"
        : "#00ff88";
}

function setLoading(isLoading) {
    loginButton.disabled = isLoading;

    loginButton.innerHTML = isLoading
        ? "<span>VERIFYING...</span>"
        : `
            <span>ACCESS CONSOLE</span>
            <i data-lucide="arrow-right"></i>
        `;

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        setMessage("ENTER EMAIL AND PASSWORD");
        return;
    }

    setMessage("");
    setLoading(true);

    const {
        data: loginData,
        error: loginError
    } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (loginError || !loginData.user) {
        setLoading(false);
        setMessage("INVALID CREDENTIALS");
        return;
    }

    const { data: adminRecord, error: adminError } =
        await supabaseClient
            .from("admins")
            .select("user_id")
            .eq("user_id", loginData.user.id)
            .maybeSingle();

    if (adminError || !adminRecord) {
        await supabaseClient.auth.signOut();

        setLoading(false);
        setMessage("ADMIN PRIVILEGES REQUIRED");
        return;
    }

    setMessage("ACCESS GRANTED", false);

    setTimeout(() => {
        window.location.href = "./index.html";
    }, 500);
});

if (window.lucide) {
    window.lucide.createIcons();
}