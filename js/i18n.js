const translations = {
  en: {
    dashboard: "Dashboard",
    members: "Members",
    savings: "Savings",
    loans: "Loans",
    repayments: "Repayments",
    withdrawals: "Withdrawals",
    reports: "Reports",
    users: "Users",
    settings: "Settings",
    logout: "Logout",
    financialDashboard: "Financial Dashboard",
    overview: "Dashboard Overview",
    welcome: "Welcome to SACCO Banking System",
    quickActions: "Quick Actions",
    addMember: "Add Member",
    depositSavings: "Savings",
    createLoan: "Loans",
    netProfit: "Net Profit",
    totalMembers: "Total Members",
    totalSavings: "Total Savings",
    totalLoans: "Total Loans"
  },

  am: {
    dashboard: "ዳሽቦርድ",
    members: "አባላት",
    savings: "ቁጠባ",
    loans: "ብድር",
    repayments: "ክፍያ",
    withdrawals: "መውጣት",
    reports: "ሪፖርት",
    users: "ተጠቃሚዎች",
    settings: "ቅንብሮች",
    logout: "ውጣ",
    financialDashboard: "የፋይናንስ ዳሽቦርድ",
    overview: "አጠቃላይ እይታ",
    welcome: "እንኳን ወደ SACCO በደህና መጡ",
    quickActions: "ፈጣን እርምጃዎች",
    addMember: "አባል አክል",
    depositSavings: "ቁጠባ",
    createLoan: "ብድር ፍጠር",
    netProfit: "ንጹህ ትርፍ",
    totalMembers: "ጠቅላላ አባላት",
    totalSavings: "ጠቅላላ ቁጠባ",
    totalLoans: "ጠቅላላ ብድር"
  },

  om: {
    dashboard: "Daashboordii",
    members: "Miseensota",
    savings: "Quusaa",
    loans: "Liizii",
    repayments: "Deebii",
    withdrawals: "Ba’iinsa",
    reports: "Gabaasa",
    users: "Fayyadamtoota",
    settings: "Sajoo",
    logout: "Ba’i",
    financialDashboard: "Daashboordii Faayinaansii",
    overview: "Ilaalcha Waliigalaa",
    welcome: "Baga Gara SACCO dhuftan",
    quickActions: "Gocha Saffisaa",
    addMember: "Miseensa Dabali",
    depositSavings: "Quusaa",
    createLoan: "Liizii Uumi",
    netProfit: "Faayidaa Netoo",
    totalMembers: "Waliigala Miseensota",
    totalSavings: "Waliigala Quusaa",
    totalLoans: "Waliigala Liizii"
  }
};

function changeLanguage(lang) {
  localStorage.setItem("lang", lang);
  applyLanguage(lang);
}

function applyLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.getElementById("languageSelect").value = lang;
}

document.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem("lang") || "en";
  applyLanguage(lang);
});
