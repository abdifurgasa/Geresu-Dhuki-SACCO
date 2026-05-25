const translations = {
  en: {
    dashboard: "Dashboard",
    members: "Members",
    member: "Member",
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
    welcome: "Welcome to Geresu Dhuki SACCO Banking System",
    quickActions: "Quick Actions",
    addMember: "Add Member",
    name: "Name",
    phone: "Phone",
    createdDate: "Created Date",
    createdBy: "Created By",
    depositSavings: "Deposit Savings",
    createLoan: "Create Loans",
    remainingLoan: "Remaining Loan",
    netProfit: "Net Profit",
    totalMembers: "Total Members",
    totalSavings: "Total Savings",
    totalLoans: "Total Loans"
  },

  am: {
    dashboard: "ዳሽቦርድ",
    members: "አባላት",
    member: "አባል",
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
    welcome: "እንኳን ወደ ገረሱ ዱኪ SACCO ባንክ ሲስተም በደህና መጡ",
    quickActions: "ፈጣን እርምጃዎች",
    addMember: "አባል አክል",
    name: "ስም",
    phone: "ስልክ",
    createdDate: "የተመዘገበበት ቀን",
    createdBy: "የመዘገበ ሰዉ",
    depositSavings: "ቁጠባ አክል",
    createLoan: "ብድር ፈጥር",
    remainingLoan: "ቀሪ ብድር",
    netProfit: "ንጹህ ትርፍ",
    totalMembers: "ጠቅላላ አባላት",
    totalSavings: "ጠቅላላ ቁጠባ",
    totalLoans: "ጠቅላላ ብድር"
  },

  om: {
    dashboard: "Daashboordii",
    members: "Miseensota",
    member: "Miseensa",
    savings: "Qusannaa",
    loans: "Liqii",
    repayments: "Deebii",
    withdrawals: "Baasii",
    reports: "Gabaasa",
    users: "Fayyadamtoota",
    settings: "Sirreessituu",
    logout: "Ba’i",
    financialDashboard: "Daashboordii Faayinaansii",
    overview: "Ilaalcha Waliigalaa",
    welcome: "Baga Gara Sirna Baankii SACCO Geresu Dhuki Nagaan Dhuftan",
    quickActions: "Gocha Saffisaa",
    addMember: "Miseensa Dabali",
    name: "Maqaa",
    phone: "Bilbila",
    createdDate: "Guyyaa Galmaa'e",
    createdBy: "Kan Galmeesse",
    depositSavings: "Qusannaa Galchi",
    createLoan: "Liqii Uumi",
    remainingLoan: "Haftee Liqii",
    netProfit: "Bu'aa Qulqulluu",
    totalMembers: "Miseensota Waliigalaa",
    totalSavings: "Qusannaa Waliigalaa",
    totalLoans: "Liqii Waliigalaa"
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
