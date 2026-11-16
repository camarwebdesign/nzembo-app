// shared-store.js - Moteur de données partagé réactif entre app.nzembo.com et admin.nzembo.com
// Synchronisation immédiate via localStorage et BroadcastChannel / StorageEvent

(function() {
  const STORAGE_KEY = 'nzembo_live_data_v4';
  const EVENT_CHANNEL = 'nzembo_channel_v4';

  // Synthétiseur audio Web Audio API pour les notifications et bips sonores réels
  function playNotificationChime(type = 'default') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'money' || type === 'success') {
        // Carillon deux notes ascendantes cristallin (succès / argent)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'admin' || type === 'broadcast') {
        // Son de notification "Pim" clair et audible
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(987.77, now + 0.12); // B5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else {
        // Notification cloche standard
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch(e) {
      console.warn('Audio chime unavailable:', e);
    }
  }

  const defaultData = {
    stats: {
      totalUsers: 12480,
      totalSongs: 38920,
      creditsSold: 84250,
      grossRevenueUSD: 42125.00,
      grossRevenueCDF: 120056250,
      todayNewUsers: 48,
      todaySongs: 142
    },
    userAccount: {
      id: 'usr_84920',
      name: 'Utilisateur',
      email: 'contact@nzembo.com',
      credits: 0,
      referralCode: 'NZ-84920',
      referralLink: 'https://nzembo.com/invite/NZ-84920',
      referralStats: {
        friendsInvited: 2,
        creditsEarned: 1.0, // 2 filleuls × 0.5 crédit
        cashEarnedUSD: 0.05, // 1 crédit @ 0.05$
        cashEarnedCDF: 142.50, // ~142.5 CDF
        creditExchangeRateUSD: 0.05, // Valeur de rachat par la plateforme: 1 crédit = 0.05 $
        creditExchangeRateCDF: 142.50
      }
    },
    messages: [
      {
        id: 'msg_welcome',
        target: 'all',
        category: 'annonce', // 'annonce', 'promo', 'info', 'update'
        categoryLabel: 'Annonce Officielle',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-cyan-300',
        title: 'Lancement officiel du Studio Nzembo 2.0 🎵',
        subject: 'Découvrez la nouvelle génération de musiques personnalisées par IA',
        content: `Chers créateurs,\n\nBienvenue sur la toute nouvelle version du Studio Nzembo ! Vous pouvez désormais générer vos chansons d'anniversaire, mariage et célébration en Rumba Congolaise, Afrobeat, Gospel et bien plus avec des voix authentiques et des arrangements studio 320 kbps.\n\nChaque ami invité vous fait gagner +1 crédit utilisable pour créer de la musique ou échangeable en argent liquide via Mobile Money.\n\nBonne création musicale !`,
        date: 'Aujourd\'hui 09:30',
        readBy: [],
        likes: 124,
        loves: 89,
        fires: 45
      },
      {
        id: 'msg_promo_weekend',
        target: 'all',
        category: 'promo',
        categoryLabel: 'Offre Spéciale',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        title: 'Promotion Week-End : -15% sur tous les packs ! 🔥',
        subject: 'Code promo NZEMBO valable sur le Pack Créateur et Premium',
        content: `Profitez d'un tarif préférentiel sur vos recharges de crédits ce week-end !\n\nUtilisez le code promo « NZEMBO » lors de votre achat pour bénéficier d'une remise immédiate de 15% sur tous les packs.`,
        date: 'Hier 16:45',
        readBy: [],
        likes: 210,
        loves: 154,
        fires: 98
      }
    ],
    traffic: {
      sources: [
        { id: 'whatsapp', name: 'WhatsApp (Partages directs & groupes)', icon: 'whatsapp', count: 4742, pct: 38, color: '#25D366' },
        { id: 'google', name: 'Google (Recherche naturelle & SEO)', icon: 'google', count: 3494, pct: 28, color: '#4285F4' },
        { id: 'telegram', name: 'Telegram (Canaux et groupes musique)', icon: 'telegram', count: 1872, pct: 15, color: '#229ED9' },
        { id: 'referral', name: 'Liens de parrainage (Partenaires affiliés)', icon: 'referral', count: 1372, pct: 11, color: '#7C3AED' },
        { id: 'socials', name: 'Facebook, TikTok, Instagram & X', icon: 'socials', count: 998, pct: 8, color: '#E1306C' }
      ],
      devices: [
        { id: 'android', name: 'Android Mobile (Samsung, Tecno, Infinix)', icon: '📱', pct: 68, count: 8486 },
        { id: 'ios', name: 'iPhone iOS (Safari, PWA)', icon: '🍎', pct: 24, count: 2995 },
        { id: 'desktop', name: 'PC Windows & Mac Desktop', icon: '💻', pct: 8, count: 999 }
      ],
      browsers: [
        { name: 'Chrome Mobile / Desktop', pct: 62 },
        { name: 'Safari iOS', pct: 23 },
        { name: 'WhatsApp Webview / In-App', pct: 10 },
        { name: 'Autres (Samsung Browser, Firefox)', pct: 5 }
      ],
      geography: [
        { country: '🇨🇩 RDC (Kinshasa, Lubumbashi, Goma)', pct: 54, count: 6739 },
        { country: '🇨🇮 Côte d\'Ivoire (Abidjan)', pct: 18, count: 2246 },
        { country: '🇫🇷 France (Paris, Lyon)', pct: 14, count: 1747 },
        { country: '🇨🇬 Congo-Brazzaville', pct: 8, count: 998 },
        { country: '🇧🇪 Belgique & Diaspora', pct: 6, count: 750 }
      ]
    },
    packBreakdown: {
      createur: { count: 4890, pct: 58 },
      premium: { count: 2280, pct: 27 },
      decouverte: { count: 1260, pct: 15 }
    },
    users: [
      { id: 'u1', name: 'Serge Kabamba', email: 'serge.k@gmail.com', country: '🇨🇩 RDC (Kinshasa)', credits: 5, songs: 8, spentCDF: 35000, spentUSD: 12.25, referrals: 4, device: 'Android (Samsung Galaxy)', origin: 'WhatsApp' },
      { id: 'u2', name: 'Marie Diop', email: 'marie.diop@orange.sn', country: '🇸🇳 Sénégal (Dakar)', credits: 1, songs: 3, spentCDF: 36000, spentUSD: 12.60, referrals: 1, device: 'iPhone 13', origin: 'Google' },
      { id: 'u3', name: 'Antoine Traoré', email: 'antoine.t@yahoo.fr', country: '🇨🇮 Côte d\'Ivoire (Abidjan)', credits: 12, songs: 14, spentCDF: 71250, spentUSD: 25.00, referrals: 9, device: 'Android (Tecno Camon)', origin: 'WhatsApp' },
      { id: 'u4', name: 'Esther Mokili', email: 'esther.m@gmail.com', country: '🇨🇩 RDC (Lubumbashi)', credits: 3, songs: 2, spentCDF: 10000, spentUSD: 3.50, referrals: 3, device: 'Android (Infinix Hot)', origin: 'Telegram' },
      { id: 'u5', name: 'Christian Mavinga', email: 'c.mavinga@outlook.com', country: '🇫🇷 France (Paris)', credits: 15, songs: 18, spentCDF: 85500, spentUSD: 30.00, referrals: 6, device: 'PC Windows (Chrome)', origin: 'Lien Parrainage' },
      { id: 'usr_84920', name: 'Utilisateur', email: 'contact@nzembo.com', country: '🇨🇩 RDC (Kinshasa)', credits: 0, songs: 2, spentCDF: 0, spentUSD: 0.00, referrals: 2, device: 'Android (Galaxy Z Fold)', origin: 'Google' }
    ],
    transactions: [
      { id: 'TX-9842', client: 'Serge Kabamba', pack: 'Pack Créateur (4 crédits)', credits: 4, amountCDF: 10000, amountUSD: 3.50, method: 'M-Pesa (Vodacom)', time: 'Il y a 12 min', status: 'Payé' },
      { id: 'TX-9841', client: 'Antoine Traoré', pack: 'Pack Premium (12 crédits)', credits: 12, amountCDF: 25000, amountUSD: 8.75, method: 'Orange Money', time: 'Il y a 34 min', status: 'Payé' },
      { id: 'TX-9840', client: 'Esther Mokili', pack: 'Pack Découverte (1 crédit)', credits: 1, amountCDF: 2000, amountUSD: 0.70, method: 'Airtel Money', time: 'Il y a 1h', status: 'Payé' },
      { id: 'TX-9839', client: 'Christian Mavinga', pack: 'Pack Premium (12 crédits)', credits: 12, amountCDF: 25000, amountUSD: 8.75, method: 'Carte Bancaire / Stripe', time: 'Il y a 2h', status: 'Payé' }
    ],
    withdrawals: [
      { id: 'W-501', userId: 'u3', user: 'Antoine Traoré', country: '🇨🇮 Côte d\'Ivoire', referralsCount: 9, creditsConverted: 75, amountUSD: 3.75, amountLocal: '2 460 FCFA', method: 'Orange Money CI (+225 07 00 0000)', status: 'En attente', date: 'Aujourd\'hui 10:14' },
      { id: 'W-502', userId: 'u1', user: 'Serge Kabamba', country: '🇨🇩 RDC', referralsCount: 4, creditsConverted: 40, amountUSD: 2.00, amountLocal: '5 700 CDF', method: 'M-Pesa Vodacom (+243 81 222 3333)', status: 'En attente', date: 'Aujourd\'hui 08:30' }
    ]
  };

  function getAuthoritativeCredits(fallbackVal = 0) {
    try {
      const explicit = localStorage.getItem('nzembo_user_credits');
      if (explicit !== null && explicit !== '' && !isNaN(Number(explicit))) {
        return Math.max(0, Number(explicit));
      }
      const authRaw = localStorage.getItem('nzembo_auth_user');
      if (authRaw) {
        const parsedUser = JSON.parse(authRaw);
        if (parsedUser && parsedUser.credits !== undefined && parsedUser.credits !== null && !isNaN(Number(parsedUser.credits))) {
          return Math.max(0, Number(parsedUser.credits));
        }
      }
    } catch (e) {}
    return Math.max(0, Number(fallbackVal) || 0);
  }

  function syncAuthoritativeCredits(newVal) {
    const val = Math.max(0, Number(newVal) || 0);
    try {
      localStorage.setItem('nzembo_user_credits', String(val));
      localStorage.setItem('nzembo_credits_updated_at', String(Date.now()));
      const authRaw = localStorage.getItem('nzembo_auth_user');
      if (authRaw) {
        const parsedUser = JSON.parse(authRaw);
        if (parsedUser && typeof parsedUser === 'object') {
          parsedUser.credits = val;
          localStorage.setItem('nzembo_auth_user', JSON.stringify(parsedUser));
        }
      }
    } catch (e) {}
    return val;
  }

  function loadStore() {
    let storeData = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) storeData = JSON.parse(saved);
    } catch(e) {
      console.warn('Error reading store:', e);
    }
    if (!storeData) {
      storeData = JSON.parse(JSON.stringify(defaultData));
    }
    if (!storeData.userAccount) {
      storeData.userAccount = JSON.parse(JSON.stringify(defaultData.userAccount));
    }
    // Toujours synchroniser avec la source de vérité des crédits (jamais de "3" magique)
    storeData.userAccount.credits = getAuthoritativeCredits(0);
    return storeData;
  }

  function saveStore(data) {
    try {
      if (data && data.userAccount && data.userAccount.credits !== undefined) {
        syncAuthoritativeCredits(data.userAccount.credits);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      notifyChange();
    } catch(e) {
      console.error('Error saving store:', e);
    }
  }

  function notifyChange() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(EVENT_CHANNEL);
        bc.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
        bc.close();
      }
    } catch(e) {}
  }

  // API Publique NzemboStore
  window.NzemboStore = {
    get: loadStore,
    save: saveStore,
    playChime: playNotificationChime,

    getUserCredits: function() {
      return getAuthoritativeCredits(0);
    },

    setUserCredits: function(newCredits) {
      const val = syncAuthoritativeCredits(newCredits);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultData));
        if (!data.userAccount) data.userAccount = {};
        data.userAccount.credits = val;
        const demoUser = Array.isArray(data.users) ? data.users.find(u => u.id === 'usr_84920') : null;
        if (demoUser) demoUser.credits = val;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
      return val;
    },

    // Quand un utilisateur achète un pack de crédits
    // Déduire des crédits lors d'une génération musicale ou utilisation d'un outil studio
    deductCredits: function(amount = 1, reason = 'Création musicale IA') {
      const data = loadStore();
      const cost = Math.max(0, parseInt(amount, 10) || 1);
      const currentBal = getAuthoritativeCredits(data.userAccount.credits);
      const newBal = Math.max(0, currentBal - cost);
      data.userAccount.credits = newBal;
      syncAuthoritativeCredits(newBal);
      const demoUser = data.users.find(u => u.id === 'usr_84920');
      if (demoUser) {
        demoUser.credits = newBal;
        demoUser.songs = (demoUser.songs || 0) + 1;
      }
      saveStore(data);
      return newBal;
    },

    recordCreditPurchase: function(packType, packName, creditsAmount, priceUSD, priceCDF, paymentMethod) {
      const data = loadStore();
      const added = Math.max(0, Number(creditsAmount) || 0);
      const currentBal = getAuthoritativeCredits(data.userAccount.credits);
      const newBal = currentBal + added;
      data.userAccount.credits = newBal;
      syncAuthoritativeCredits(newBal);
      const demoUser = data.users.find(u => u.id === 'usr_84920');
      if (demoUser) {
        demoUser.credits = newBal;
        demoUser.spentCDF += priceCDF;
        demoUser.spentUSD += priceUSD;
      }

      data.stats.creditsSold += creditsAmount;
      data.stats.grossRevenueUSD += priceUSD;
      data.stats.grossRevenueCDF += priceCDF;

      const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
      data.transactions.unshift({
        id: txId,
        client: 'Utilisateur Démo',
        pack: `${packName} (${creditsAmount} crédit${creditsAmount > 1 ? 's' : ''})`,
        credits: creditsAmount,
        amountCDF: priceCDF,
        amountUSD: priceUSD,
        method: paymentMethod || 'Mobile Money (Instantané)',
        time: 'À l\'instant',
        status: 'Payé'
      });

      // Bonus parrainage : 0.1 crédit par crédit acheté par le filleul
      const referralBonusCredits = +(creditsAmount * 0.1).toFixed(2);
      data.userAccount.referralStats.friendsInvited += 1;
      data.userAccount.referralStats.creditsEarned = +(data.userAccount.referralStats.creditsEarned + referralBonusCredits).toFixed(2);
      data.userAccount.referralStats.cashEarnedUSD = +(data.userAccount.referralStats.cashEarnedUSD + (referralBonusCredits * 0.05)).toFixed(2);
      data.userAccount.referralStats.cashEarnedCDF = Math.round(data.userAccount.referralStats.cashEarnedCDF + (referralBonusCredits * 142.5));

      saveStore(data);
      playNotificationChime('money');
      return data;
    },

    // Demande de rachat multi-pays (RDC, Côte d'Ivoire, Sénégal, Cameroun, France/Europe, etc.)
    requestCreditCashoutMultiCountry: function(creditsToConvert, countryName, provider, accountDetail, estimatedLocalText, cashUSD) {
      const data = loadStore();
      const earnedCredits = data.userAccount.referralStats.creditsEarned;
      if (creditsToConvert > earnedCredits) {
        return { success: false, message: 'Solde de crédits de parrainage insuffisant.' };
      }

      // Déduire des crédits parrainage
      data.userAccount.referralStats.creditsEarned -= creditsToConvert;
      data.userAccount.referralStats.cashEarnedUSD = Math.max(0, +(data.userAccount.referralStats.cashEarnedUSD - cashUSD).toFixed(2));
      data.userAccount.referralStats.cashEarnedCDF = Math.max(0, data.userAccount.referralStats.cashEarnedCDF - Math.round(creditsToConvert * 142.5));

      const wId = 'W-' + Math.floor(500 + Math.random() * 500);
      const newWithdrawal = {
        id: wId,
        userId: data.userAccount.id,
        user: data.userAccount.name,
        country: countryName,
        referralsCount: data.userAccount.referralStats.friendsInvited,
        creditsConverted: creditsToConvert,
        amountUSD: cashUSD,
        amountLocal: estimatedLocalText,
        method: `${provider} (${accountDetail})`,
        status: 'En attente',
        date: 'À l\'instant'
      };

      data.withdrawals.unshift(newWithdrawal);

      // Notification automatique pour le client
      data.messages.unshift({
        id: 'msg_cashout_' + Date.now(),
        target: data.userAccount.id,
        category: 'info',
        categoryLabel: 'Demande de Retrait Transmise',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        title: 'Votre rachat de crédits a été envoyé avec succès ! 💵',
        subject: `Rachat de ${creditsToConvert} crédits (${estimatedLocalText} / $${cashUSD}) via ${provider}`,
        content: `Votre demande de rachat de ${creditsToConvert} crédits en argent liquide a bien été reçue par notre équipe financière.\n\nMode de paiement : ${provider}\nCoordonnées : ${accountDetail}\nMontant estimé : ${estimatedLocalText} (~$${cashUSD} USD)\nStatut actuel : En cours de validation\n\nLe virement sera validé par l'administration dans un délai de 30 minutes à 2 heures.`,
        date: 'À l\'instant',
        readBy: [],
        likes: 0,
        loves: 0,
        fires: 0
      });

      saveStore(data);
      playNotificationChime('money');
      return { success: true, wId, estimatedLocalText, cashUSD };
    },

    // Envoi de message / diffusion structurée par l'Admin
    adminBroadcastMessage: function(category, categoryLabel, title, subject, content, targetGroup) {
      const data = loadStore();
      
      const badgeColors = {
        annonce: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-cyan-300',
        promo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        update: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      };

      const newMsg = {
        id: 'msg_' + Date.now(),
        target: targetGroup, // 'all', 'creators', 'active', ou user ID spécifique
        category: category,
        categoryLabel: categoryLabel || 'Information Nzembo',
        badgeColor: badgeColors[category] || badgeColors.annonce,
        title: title,
        subject: subject,
        content: content,
        date: 'À l\'instant',
        readBy: [],
        likes: 0,
        loves: 0,
        fires: 0
      };

      data.messages.unshift(newMsg);
      saveStore(data);
      playNotificationChime('broadcast');
      return true;
    },

    // Réactions interactives utilisateur (Likes, Loves, Fires)
    reactToMessage: function(messageId, reactionType) {
      const data = loadStore();
      const msg = data.messages.find(m => m.id === messageId);
      if (msg) {
        if (reactionType === 'like') msg.likes = (msg.likes || 0) + 1;
        if (reactionType === 'love') msg.loves = (msg.loves || 0) + 1;
        if (reactionType === 'fire') msg.fires = (msg.fires || 0) + 1;
        saveStore(data);
        return msg;
      }
      return null;
    },

    // Marquer un message comme lu par l'utilisateur
    markMessageRead: function(messageId) {
      const data = loadStore();
      const msg = data.messages.find(m => m.id === messageId);
      if (msg) {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.includes(data.userAccount.id)) {
          msg.readBy.push(data.userAccount.id);
          saveStore(data);
        }
      }
    },

    // Supprimer une notification / message de la liste
    deleteMessage: function(messageId) {
      const data = loadStore();
      const idx = data.messages.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        data.messages.splice(idx, 1);
        saveStore(data);
        return true;
      }
      return false;
    },

    // Créditer manuellement un utilisateur depuis l'Admin
    adminCreditUser: function(userIdOrName, amount) {
      const data = loadStore();
      const num = parseInt(amount, 10);
      if (isNaN(num) || num <= 0) return false;

      const user = data.users.find(u => u.name === userIdOrName || u.id === userIdOrName);
      if (user) {
        user.credits += num;
        if (user.id === 'usr_84920' || user.name === data.userAccount.name) {
          data.userAccount.credits += num;
        }
      }
      data.stats.creditsSold += num;

      // Ajouter message pour l'utilisateur crédité
      data.messages.unshift({
        id: 'msg_credit_' + Date.now(),
        target: user ? user.id : 'usr_84920',
        category: 'info',
        categoryLabel: 'Recharge Gratuite',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        title: 'Crédits offerts par l\'administrateur ! ⚡',
        subject: `+${num} crédits ajoutés à votre compte`,
        content: `Bonjour ${user ? user.name : 'Créateur'},\n\nL'équipe d'administration Nzembo vient d'ajouter avec succès +${num} crédits gratuits à votre solde studio. Profitez-en pour composer de nouvelles mélodies personnalisées !`,
        date: 'À l\'instant',
        readBy: [],
        likes: 0,
        loves: 0,
        fires: 0
      });

      saveStore(data);
      playNotificationChime('admin');
      return true;
    },

    // Validation d'un retrait par l'Admin
    adminApproveWithdrawal: function(wId, customNote = '') {
      const data = loadStore();
      const w = data.withdrawals.find(item => item.id === wId);
      if (w) {
        w.status = 'Validé';

        // Message de confirmation du virement
        data.messages.unshift({
          id: 'msg_w_approved_' + Date.now(),
          target: w.userId || 'usr_84920',
          category: 'promo',
          categoryLabel: 'Retrait Confirmé',
          badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
          title: 'Virement Mobile Money effectué avec succès ! ✅',
          subject: `Retrait validé : ${w.amountLocal} (~$${w.amountUSD})`,
          content: `Votre demande de retrait de ${w.creditsConverted} crédits parrainage a été validée et envoyée avec succès.\n\nMontant versé : ${w.amountLocal} (~$${w.amountUSD} USD)\nMoyen de paiement : ${w.method}\nPays : ${w.country}\n${customNote ? 'Note du gestionnaire : ' + customNote : 'Merci de votre fidélité et de recommander Nzembo !'}`,
          date: 'À l\'instant',
          readBy: [],
          likes: 0,
          loves: 0,
          fires: 0
        });

        saveStore(data);
        playNotificationChime('money');
        return true;
      }
      return false;
    },

    // Rejet d'un retrait par l'Admin
    adminRejectWithdrawal: function(wId, reason = '') {
      const data = loadStore();
      const w = data.withdrawals.find(item => item.id === wId);
      if (w) {
        w.status = 'Refusé';

        // Réintégrer les crédits de parrainage
        if (w.userId === data.userAccount.id || w.user === data.userAccount.name) {
          data.userAccount.referralStats.creditsEarned += w.creditsConverted;
          data.userAccount.referralStats.cashEarnedUSD = +(data.userAccount.referralStats.cashEarnedUSD + w.amountUSD).toFixed(2);
          data.userAccount.referralStats.cashEarnedCDF += Math.round(w.creditsConverted * 142.5);
        }

        // Message de notification de refus
        data.messages.unshift({
          id: 'msg_w_rejected_' + Date.now(),
          target: w.userId || 'usr_84920',
          category: 'info',
          categoryLabel: 'Statut du Retrait',
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
          title: 'Demande de retrait non aboutie ⚠️',
          subject: `Refus de conversion (${w.creditsConverted} crédits réintégrés)`,
          content: `Votre demande de retrait de ${w.amountLocal} n'a pas pu être finalisée.\n\nMotif : ${reason || 'Coordonnées ou opérateur non valides.'}\n\nVos ${w.creditsConverted} crédits ont été automatiquement recrédités sur votre solde de parrainage. Vous pouvez renouveler votre demande avec des coordonnées corrigées.`,
          date: 'À l\'instant',
          readBy: [],
          likes: 0,
          loves: 0,
          fires: 0
        });

        saveStore(data);
        return true;
      }
      return false;
    },

    // Abonnement aux changements en temps réel
    onSync: function(callback) {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) callback(loadStore());
      });
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(EVENT_CHANNEL);
        bc.onmessage = () => callback(loadStore());
      }
    }
  };
})();
