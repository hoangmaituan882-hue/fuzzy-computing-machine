-- Clear existing seed data to prevent duplicate keys
DELETE FROM screenings;
DELETE FROM nominations;
DELETE FROM votes;
DELETE FROM reviews;

-- Insert Screenings
-- Upcoming screening (Sunday, 2026-07-12)
INSERT INTO screenings (id, title, date, bilibili_bvid, description, status, anime_title, anime_cover, created_at)
VALUES (
  'screening-next',
  '第 24 期：夏日狂欢联播',
  '2026-07-12',
  'BV1ae4y1d78f',
  '莉可丽丝（Lycoris Recoil）全集一口气补完计划！百合与枪战的极致视觉盛宴。',
  'upcoming',
  '莉可丽丝',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=60',
  1719920000000
);

-- Past Screening 23
INSERT INTO screenings (id, title, date, bilibili_bvid, description, status, anime_title, anime_cover, created_at)
VALUES (
  'screening-23',
  '第 23 期：年度高分霸权回顾',
  '2025-01-19',
  'BV1mG411d7v4',
  '年度现象级神作《葬送的芙莉莲》前半程连播！体会时间流逝的温情史诗。',
  'completed',
  '葬送的芙莉莲',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=60',
  1737288000000
);

-- Past Screening 22
INSERT INTO screenings (id, title, date, bilibili_bvid, description, status, anime_title, anime_cover, created_at)
VALUES (
  'screening-22',
  '第 22 期：社恐与摇滚之夜',
  '2025-01-12',
  'BV11P4y1t7Yp',
  '《孤独摇滚！》名场面神回连播。跟着纽带乐队感受青春与社恐日常的碰撞。',
  'completed',
  '孤独摇滚！',
  'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=60',
  1736683200000
);

-- Past Screening 21
INSERT INTO screenings (id, title, date, bilibili_bvid, description, status, anime_title, anime_cover, created_at)
VALUES (
  'screening-21',
  '第 21 期：热血机战终极燃曲',
  '2024-12-29',
  'BV1Ys411a7mK',
  '《天元突破：红莲螺岩》剧场版连播！感受热血钻头的极致浪漫。',
  'completed',
  '天元突破红莲螺岩',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60',
  1735473600000
);


-- Insert Nominations
-- Pending Nominations (active for voting)
INSERT INTO nominations (id, screening_id, title, cover, type, nominated_by_id, nominated_by_name, reason, status, created_at)
VALUES (
  'nom-1',
  NULL,
  '迷宫饭',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
  'anime',
  'user-1',
  '小明',
  '地下城与奇幻美食的完美融合，九井谅子原作神级改编，越看越饿，非常适合放映会边吃宵夜边看！',
  'pending',
  1719920000000
);

INSERT INTO nominations (id, screening_id, title, cover, type, nominated_by_id, nominated_by_name, reason, status, created_at)
VALUES (
  'nom-2',
  NULL,
  '排球少年！！垃圾场决战',
  'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=500&auto=format&fit=crop&q=60',
  'movie',
  'user-2',
  '小红',
  '剧场版终于出资源了！乌野与音驹的宿命对决，热血与感动的终极体现，求排片！',
  'pending',
  1719925000000
);

INSERT INTO nominations (id, screening_id, title, cover, type, nominated_by_id, nominated_by_name, reason, status, created_at)
VALUES (
  'nom-3',
  NULL,
  '奇异贤伴 黑色天使',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
  'anime',
  'user-3',
  '老张',
  '泛式推荐过的机战新番，女主诺娃超可爱，吐槽点也挺多的，感觉团播效果会拉满。',
  'pending',
  1719930000000
);

-- Selected Nominations (linked to past screenings)
INSERT INTO nominations (id, screening_id, title, cover, type, nominated_by_id, nominated_by_name, reason, status, created_at)
VALUES (
  'nom-4',
  'screening-23',
  '葬送的芙莉莲',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60',
  'anime',
  'user-1',
  '小明',
  '跨越百年的回忆，静水流深的温柔，作画音乐拉满，绝对是一定要在大屏幕放映会上和大家一起欣赏的神作。',
  'selected',
  1737000000000
);

INSERT INTO nominations (id, screening_id, title, cover, type, nominated_by_id, nominated_by_name, reason, status, created_at)
VALUES (
  'nom-5',
  'screening-22',
  '孤独摇滚！',
  'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=60',
  'anime',
  'user-2',
  '小红',
  '波奇酱搞笑日常，神级演出层出不穷，社恐人的共鸣，看几遍都不过瘾！',
  'selected',
  1736000000000
);


-- Insert Reviews
-- For 葬送的芙莉莲
INSERT INTO reviews (id, screening_id, user_id, user_name, rating, comment, created_at)
VALUES ('rev-1', 'screening-23', 'user-1', '小明', 5, '这简直是近年来最强奇幻番剧，镜头感和台词深度极高，吹爆！', 1737300000000);

INSERT INTO reviews (id, screening_id, user_id, user_name, rating, comment, created_at)
VALUES ('rev-2', 'screening-23', 'user-2', '小红', 5, '辛美尔虽然出场少，但真的活在每个人的心里，温柔的人拯救了芙莉莲的漫长时光。', 1737305000000);

INSERT INTO reviews (id, screening_id, user_id, user_name, rating, comment, created_at)
VALUES ('rev-3', 'screening-23', 'user-3', '老张', 4, '打斗流畅，文戏惊艳，唯一的遗憾是放映会一晚上看不够，希望能有下一期接着看！', 1737310000000);

-- For 孤独摇滚！
INSERT INTO reviews (id, screening_id, user_id, user_name, rating, comment, created_at)
VALUES ('rev-4', 'screening-22', 'user-1', '小明', 5, '波奇酱的神经质日常笑得我肚子疼！音乐插入极神！', 1736700000000);

INSERT INTO reviews (id, screening_id, user_id, user_name, rating, comment, created_at)
VALUES ('rev-5', 'screening-22', 'user-3', '老张', 5, '在放映会里和群友一块发癫感觉太棒了，纽带乐队天下第一！', 1736705000000);


-- Insert Votes (Simulate voting counts)
-- User 1 votes for nom-1
INSERT INTO votes (id, nomination_id, user_id, created_at) VALUES ('v-1', 'nom-1', 'user-1', 1719921000000);
-- User 2 votes for nom-1
INSERT INTO votes (id, nomination_id, user_id, created_at) VALUES ('v-2', 'nom-1', 'user-2', 1719922000000);
-- User 3 votes for nom-1
INSERT INTO votes (id, nomination_id, user_id, created_at) VALUES ('v-3', 'nom-1', 'user-3', 1719923000000);

-- User 1 votes for nom-2
INSERT INTO votes (id, nomination_id, user_id, created_at) VALUES ('v-4', 'nom-2', 'user-1', 1719926000000);
-- User 3 votes for nom-2
INSERT INTO votes (id, nomination_id, user_id, created_at) VALUES ('v-5', 'nom-2', 'user-3', 1719927000000);

-- Keep the live nomination campaign empty after seeding demo screening history.
DELETE FROM votes;
DELETE FROM nominations;
DELETE FROM screening_participants;
