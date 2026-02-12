export const ThemeScript = () => {
    const code = `
    (function() {
      try {
        var localTheme = localStorage.getItem('swiftpos-theme');
        var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
        if (!localTheme && supportDarkMode) localTheme = 'dark';
        if (localTheme) {
          document.documentElement.setAttribute('data-theme', localTheme);
        }
      } catch (e) {}
    })();
  `;

    return (
        <script
            dangerouslySetInnerHTML={{
                __html: code,
            }}
        />
    );
};
