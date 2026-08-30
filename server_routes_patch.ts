        for (const commentList of communityCommentsStore.values()) {
          const found = commentList.find((c: any) => c.id === v.targetId);
          if (found && found.content) {
            targetTitle = found.content.substring(0, 40) + '...';
            break;
          }
        }
      }

      recentVotes.push({
        id: v.id,
        voterId: v.voterId,
        targetType: v.targetType,
        targetId: v.targetId,
        targetOwnerId: v.targetOwnerId,
        voteType: v.vote === 1 ? 'up' : 'down',
        targetTitle,
        timestamp: v.createdAt || new Date().toISOString(),
      });
    }
  });

  recentVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limitedVotes = recentVotes.slice(0, 20);

  res.json({
    success: true,
    karma: {
      ...karma,
      recentVotes: limitedVotes,
      activityFeed: limitedVotes,
    },
    recentVotes: limitedVotes,
  });
} catch (err: any) {
  console.error('[API /karma/:userId] error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal error' });
}
});

// ============================================================================
// DASHBOARD & TELEMETRY
// ============================================================================

// GET /api/dashboard/:userId
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const exam = (req.query.exam as string) || 'UPSC_CSE';

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('user_dashboards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return res.json({ success: true, data });
      }
    }

    const karma = userKarmaStore.get(userId) || { totalKarma: 0, postKarma: 0, commentKarma: 0 };
    const wallet = userWalletsStore.get(userId) || { coins: 0, balance: 0.0 };

    const dashboardData = {
      userId,
      exam,
      currentStreak: 7,
      totalStudyMinutes: 480,
      completedTopicsCount: 14,
      totalTopicsCount: 85,
      testAccuracy: 78.5,
      karmaPoints: karma.totalKarma,
      coinsEarned: wallet.coins,
      recentActivity: [
        { type: 'test', title: 'Polity Prelims Mock 1', score: '82%', date: new Date().toISOString() },
        { type: 'study', title: 'Fundamental Rights and DPSP', duration: '45 mins', date: new Date(Date.now() - 86400000).toISOString() },
      ],
    };

    res.json({ success: true, data: dashboardData });
  } catch (err: any) {
    console.error('[GET /api/dashboard/:userId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

// GET /api/notifications/:userId
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.json({ success: true, data });
      }
    }

    const defaultNotifications = [
      {
        id: 'notif_1',
        userId,
        title: 'Daily Goal Reminder',
        message: 'Complete your remaining 2 syllabus topics today to maintain your streak!',
        type: 'reminder',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        userId,
        title: 'New Live CBT Test Available',
        message: 'National Level Mock Test Series is now live. Rank yourself nationwide.',
        type: 'announcement',
        read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    res.json({ success: true, data: defaultNotifications });
  } catch (err: any) {
    console.error('[GET /api/notifications/:userId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/notifications/:id/read
app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Notification ID is required' });
    }

    if (supabaseServer) {
      const { error } = await supabaseServer
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[POST /api/notifications/:id/read] Supabase error:', error.message);
      }
    }

    res.json({ success: true, data: { id, read: true } });
  } catch (err: any) {
    console.error('[POST /api/notifications/:id/read] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/notifications
app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const notificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || 'all',
      title,
      message,
      type: type || 'general',
      read: false,
      created_at: new Date().toISOString(),
    };

    if (supabaseServer) {
      const { error } = await supabaseServer
        .from('notifications')
        .insert(notificationRecord);

      if (error) {
        console.error('[POST /api/notifications] Supabase error:', error.message);
      }
    }

    res.json({ success: true, data: notificationRecord });
  } catch (err: any) {
    console.error('[POST /api/notifications] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// GLOBAL SEARCH
// ============================================================================

// GET /api/search?q=...
app.get('/api/search', async (req, res) => {
  try {
    const query = ((req.query.q as string) || '').toLowerCase().trim();

    if (!query) {
      return res.json({ success: true, data: { posts: [], topics: [], questions: [] } });
    }

    const posts = Array.from(communityPostsStore.values())
      .filter((p: any) => (p.title || '').toLowerCase().includes(query) || (p.content || '').toLowerCase().includes(query))
      .slice(0, 10);

    const questions = Array.from(questionBankStore.values())
      .filter((q: any) => (q.question || q.text || '').toLowerCase().includes(query) || (q.topic || '').toLowerCase().includes(query))
      .slice(0, 10);

    const topics: any[] = Array.from(syllabusNodesStore.values())
      .filter((n: any) => (n.name || n.title || '').toLowerCase().includes(query))
      .map((n: any) => ({ id: n.id, name: n.name || n.title, type: n.type || 'topic', subject: n.subject || '' }))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        posts,
        topics,
        questions,
      },
    });
  } catch (err: any) {
    console.error('[GET /api/search] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// WALLET & TRANSACTIONS
// ============================================================================

// GET /api/wallet/:userId
app.get('/api/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return res.json({ success: true, data });
      }
    }

    let wallet = userWalletsStore.get(userId);
    if (!wallet) {
      wallet = {
        userId,
        balance: 150.0,
        coins: 450,
        totalEarned: 220.0,
        updatedAt: new Date().toISOString(),
      };
      userWalletsStore.set(userId, wallet);
    }

    res.json({ success: true, data: wallet });
  } catch (err: any) {
    console.error('[GET /api/wallet/:userId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// GET /api/wallet/:userId/transactions
app.get('/api/wallet/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.json({ success: true, data });
      }
    }

    const transactions = (userPayoutsStore.get(userId) || []).map((p: any) => ({
      id: p.id,
      userId: p.userId,
      type: 'payout',
      amount: p.amount,
      status: p.status,
      created_at: p.createdAt || p.created_at || new Date().toISOString(),
    }));

    res.json({ success: true, data: transactions });
  } catch (err: any) {
    console.error('[GET /api/wallet/:userId/transactions] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/wallet/withdraw
app.post('/api/wallet/withdraw', async (req, res) => {
  try {
    const { userId, amount, upiId, method } = req.body;

    if (!userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid user ID and withdrawal amount are required' });
    }

    const withdrawAmount = Number(amount);
    let wallet = userWalletsStore.get(userId) || { userId, balance: 0, coins: 0, totalEarned: 0, updatedAt: new Date().toISOString() };

    if (wallet.balance < withdrawAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
    }

    wallet.balance -= withdrawAmount;
    wallet.updatedAt = new Date().toISOString();
    userWalletsStore.set(userId, wallet);

    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payoutRecord = {
      id: payoutId,
      userId,
      amount: withdrawAmount,
      upiId: upiId || 'aspirant@upi',
      method: method || 'UPI',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    allPayoutsStore.set(payoutId, payoutRecord);
    const userList = userPayoutsStore.get(userId) || [];
    userList.unshift(payoutRecord);
    userPayoutsStore.set(userId, userList);

    if (supabaseServer) {
      await supabaseServer.from('user_payouts').insert({
        id: payoutId,
        user_id: userId,
        amount: withdrawAmount,
        upi_id: upiId || 'aspirant@upi',
        method: method || 'UPI',
        status: 'pending',
        created_at: payoutRecord.createdAt,
      });
    }

    res.json({ success: true, data: { payout: payoutRecord, wallet } });
  } catch (err: any) {
    console.error('[POST /api/wallet/withdraw] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// COMMUNITY INTERACTIONS
// ============================================================================

// POST /api/community/vote
app.post('/api/community/vote', async (req, res) => {
  try {
    const { voterId, targetType, targetId, targetOwnerId, vote } = req.body;

    if (!voterId || !targetType || !targetId || vote === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required voting parameters' });
    }

    const voteVal = Number(vote) >= 0 ? 1 : -1;
    const voteKey = `${voterId}_${targetType}_${targetId}`;
    const existing = karmaVotesStore.get(voteKey);

    if (existing) {
      if (existing.vote === voteVal) {
        karmaVotesStore.delete(voteKey);
      } else {
        existing.vote = voteVal as 1 | -1;
        existing.createdAt = new Date().toISOString();
        karmaVotesStore.set(voteKey, existing);
      }
    } else {
      const newVote = {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        voterId,
        targetType: targetType as 'post' | 'comment',
        targetId,
        targetOwnerId: targetOwnerId || '',
        vote: voteVal as 1 | -1,
        createdAt: new Date().toISOString(),
      };
      karmaVotesStore.set(voteKey, newVote);
    }

    let updatedKarma = null;
    if (targetOwnerId) {
      updatedKarma = recalculateUserKarma(targetOwnerId);
    }

    res.json({ success: true, data: { voteKey, vote: voteVal, karma: updatedKarma } });
  } catch (err: any) {
    console.error('[POST /api/community/vote] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/community/comments
app.post('/api/community/comments', async (req, res) => {
  try {
    const { postId, content, authorName, authorAvatar, authorId } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ success: false, error: 'Post ID and comment content are required' });
    }

    const commentList = communityCommentsStore.get(postId) || [];
    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      authorId: authorId || 'usr_guest_101',
      authorName: authorName || 'Aspirant',
      authorAvatar: authorAvatar || '',
      content: content.trim(),
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
    };

    commentList.push(newComment);
    communityCommentsStore.set(postId, commentList);

    const post = communityPostsStore.get(postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
      communityPostsStore.set(postId, post);
    }

    if (supabaseServer) {
      await supabaseServer.from('community_comments').insert(newComment);
    }

    res.json({ success: true, data: newComment });
  } catch (err: any) {
    console.error('[POST /api/community/comments] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// DELETE /api/community/comments/:id
app.delete('/api/community/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Comment ID is required' });
    }

    let deleted = false;
    for (const [postId, list] of communityCommentsStore.entries()) {
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        communityCommentsStore.set(postId, list);
        const post = communityPostsStore.get(postId);
        if (post && post.commentCount) {
          post.commentCount = Math.max(0, post.commentCount - 1);
          communityPostsStore.set(postId, post);
        }
        deleted = true;
        break;
      }
    }

    if (supabaseServer) {
      await supabaseServer.from('community_comments').delete().eq('id', id);
    }

    res.json({ success: true, data: { id, deleted } });
  } catch (err: any) {
    console.error('[DELETE /api/community/comments/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/community/bookmark/:postId
app.post('/api/community/bookmark/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = communityPostsStore.get(postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    post.isBookmarked = !post.isBookmarked;
    communityPostsStore.set(postId, post);

    res.json({ success: true, data: { postId, isBookmarked: post.isBookmarked } });
  } catch (err: any) {
    console.error('[POST /api/community/bookmark/:postId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/community/tip
app.post('/api/community/tip', async (req, res) => {
  try {
    const { postId, senderId, senderName, amount } = req.body;

    if (!postId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Post ID and valid tip amount are required' });
    }

    const tipAmount = Number(amount);
    const post = communityPostsStore.get(postId);

    if (post) {
      post.tipsTotal = (post.tipsTotal || 0) + tipAmount;
      communityPostsStore.set(postId, post);
    }

    res.json({
      success: true,
      data: {
        postId,
        senderId: senderId || 'usr_guest_101',
        senderName: senderName || 'Aspirant',
        amount: tipAmount,
        message: 'Tip processed successfully',
      },
    });
  } catch (err: any) {
    console.error('[POST /api/community/tip] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// ADMIN PAYOUTS & MODERATION
// ============================================================================

// GET /api/admin/payouts
app.get('/api/admin/payouts', verifyAdminAuth, async (req, res) => {
  try {
    const statusFilter = req.query.status as string;
    let payouts = Array.from(allPayoutsStore.values());

    if (statusFilter && statusFilter !== 'all') {
      payouts = payouts.filter((p: any) => p.status === statusFilter);
    }

    res.json({ success: true, data: payouts });
  } catch (err: any) {
    console.error('[GET /api/admin/payouts] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/admin/payouts/:id/approve
app.post('/api/admin/payouts/:id/approve', verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const payout = allPayoutsStore.get(id);

    if (!payout) {
      return res.status(404).json({ success: false, error: 'Payout request not found' });
    }

    payout.status = 'approved';
    payout.processedAt = new Date().toISOString();
    allPayoutsStore.set(id, payout);

    if (supabaseServer) {
      await supabaseServer
        .from('user_payouts')
        .update({ status: 'approved', updated_at: payout.processedAt })
        .eq('id', id);
    }

    res.json({ success: true, data: payout });
  } catch (err: any) {
    console.error('[POST /api/admin/payouts/:id/approve] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/admin/moderation/:contentId/action
app.post('/api/admin/moderation/:contentId/action', verifyAdminAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { action, contentType, adminNote } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Moderation action is required' });
    }

    if (action === 'delete') {
      if (contentType === 'post') {
        communityPostsStore.delete(contentId);
      } else if (contentType === 'comment') {
        for (const [pId, list] of communityCommentsStore.entries()) {
          const filtered = list.filter((c: any) => c.id !== contentId);
          communityCommentsStore.set(pId, filtered);
        }
      }
    }

    res.json({
      success: true,
      data: {
        contentId,
        action,
        adminNote: adminNote || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[POST /api/admin/moderation/:contentId/action] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// GET /api/admin/feedback
app.get('/api/admin/feedback', verifyAdminAuth, async (_req, res) => {
  try {
    const feedbackList = Array.from(feedbackStore.values());
    res.json({ success: true, data: feedbackList });
  } catch (err: any) {
    console.error('[GET /api/admin/feedback] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// EXAMS MANAGEMENT
// ============================================================================

// GET /api/exams
app.get('/api/exams', async (_req, res) => {
  try {
    const exams = Array.from(customExamsStore.values());
    res.json({ success: true, data: exams });
  } catch (err: any) {
    console.error('[GET /api/exams] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/exams
app.post('/api/exams', async (req, res) => {
  try {
    const { name, description, category, userEmail } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Exam name is required' });
    }

    const id = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const examRecord = {
      id,
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category || 'Custom',
      userEmail: userEmail || '',
      createdAt: new Date().toISOString(),
    };

    customExamsStore.set(id, examRecord);

    if (supabaseServer) {
      await supabaseServer.from('exams').insert(examRecord);
    }

    res.json({ success: true, data: examRecord });
  } catch (err: any) {
    console.error('[POST /api/exams] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// PUT /api/exams/:id
app.put('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    let exam = customExamsStore.get(id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    exam = {
      ...exam,
      name: name ? name.trim() : exam.name,
      description: description !== undefined ? description.trim() : exam.description,
      category: category || exam.category,
      updatedAt: new Date().toISOString(),
    };

    customExamsStore.set(id, exam);

    if (supabaseServer) {
      await supabaseServer.from('exams').update(exam).eq('id', id);
    }

    res.json({ success: true, data: exam });
  } catch (err: any) {
    console.error('[PUT /api/exams/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// DELETE /api/exams/:id
app.delete('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existed = customExamsStore.delete(id);

    if (supabaseServer) {
      await supabaseServer.from('exams').delete().eq('id', id);
    }

    res.json({ success: true, data: { id, deleted: existed } });
  } catch (err: any) {
    console.error('[DELETE /api/exams/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// INGESTION ENGINE
// ============================================================================

// POST /api/admin/ingestion/trigger
app.post('/api/admin/ingestion/trigger', verifyAdminAuth, async (req, res) => {
  try {
    const { source, exam, options } = req.body;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const jobStatus = {
      jobId,
      source: source || 'manual_upload',
      exam: exam || 'UPSC_CSE',
      options: options || {},
      status: 'completed',
      processedItems: 45,
      errorsCount: 0,
      createdAt: new Date().toISOString(),
    };

    res.json({ success: true, data: jobStatus });
  } catch (err: any) {
    console.error('[POST /api/admin/ingestion/trigger] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// GET /api/admin/ingestion/status/:jobId
app.get('/api/admin/ingestion/status/:jobId', verifyAdminAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const status = {
      jobId,
      status: 'completed',
      progressPercentage: 100,
      detected: 30,
      published: 28,
      sentToReview: 2,
      rejected: 0,
      updatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: status });
  } catch (err: any) {
    console.error('[GET /api/admin/ingestion/status/:jobId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// SPA CATCH-ALL ROUTE (MUST BE LAST)
// ============================================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
