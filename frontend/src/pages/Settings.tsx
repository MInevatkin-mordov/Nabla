function Settings() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('/images/backgrounds/settings.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "40px",
        color: "white",
      }}
    >
      <h1>⚙️ Настройки</h1>

      <p>Здесь будут настройки приложения.</p>
    </div>
  );
}

export default Settings;