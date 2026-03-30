-- ============================================================
-- 萌爪家园 (Kindred Paws) - Supabase 数据库初始化脚本
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 用户资料表（与 Supabase Auth 关联）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200),
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  location VARCHAR(200) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  experience VARCHAR(100) DEFAULT '',
  interested_in VARCHAR(200) DEFAULT '',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. 宠物表
-- ============================================================
CREATE TABLE IF NOT EXISTS pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  age VARCHAR(50) NOT NULL,
  weight VARCHAR(50),
  gender VARCHAR(10),
  location VARCHAR(200) NOT NULL,
  distance VARCHAR(50) DEFAULT '未知',
  image_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  personality TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'none' CHECK (status IN ('new', 'urgent', 'none')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('adoption', 'foster')),
  category VARCHAR(50) DEFAULT '其他',
  fosterer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  fosterer_name VARCHAR(100),
  vaccination BOOLEAN DEFAULT FALSE,
  neutered BOOLEAN DEFAULT FALSE,
  microchipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. 申请表
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('adoption', 'foster')),
  status VARCHAR(20) DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'approved', 'rejected')),
  applicant_name VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  applicant_address TEXT NOT NULL,
  applicant_wechat VARCHAR(50),
  applicant_bio TEXT,
  housing_type VARCHAR(20) CHECK (housing_type IN ('owned', 'rented')),
  housing_description TEXT,
  has_outdoor_space BOOLEAN DEFAULT FALSE,
  experience_level VARCHAR(20) CHECK (experience_level IN ('new', 'some', 'experienced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UNIQUE: 一人一宠只能申请一次
ALTER TABLE applications DROP CONSTRAINT IF EXISTS unique_application;
ALTER TABLE applications
  ADD CONSTRAINT unique_application UNIQUE (pet_id, applicant_id);

-- ============================================================
-- 4. 消息表
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  sender VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  preview TEXT DEFAULT '',
  content TEXT DEFAULT '',
  icon VARCHAR(50) DEFAULT 'bell',
  is_read BOOLEAN DEFAULT FALSE,
  type VARCHAR(30) DEFAULT 'notification' CHECK (type IN ('notification', 'adoption', 'interaction')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. 收藏表
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pet_id)
);

-- ============================================================
-- 6. 聊天记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender_type VARCHAR(20) DEFAULT 'user' CHECK (sender_type IN ('user', 'shelter', 'system')),
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pets_type ON pets(type);
CREATE INDEX IF NOT EXISTS idx_pets_category ON pets(category);
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_fosterer ON pets(fosterer_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_pet ON applications(pet_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_message ON chat_messages(message_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 注意: pets 表公开可读（不启用 RLS 或使用公开策略）
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pets are publicly readable" ON pets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert pets" ON pets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Fosterer can update their own pet" ON pets FOR UPDATE USING (fosterer_id = auth.uid());

-- user_profiles 策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- applications 策略
CREATE POLICY "Applicants can view own applications" ON applications
  FOR SELECT USING (
    applicant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pets WHERE pets.id = applications.pet_id AND pets.fosterer_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can insert applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Pet owner can update application status" ON applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = applications.pet_id AND pets.fosterer_id = auth.uid())
  );

-- messages 策略
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- favorites 策略
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- chat_messages 策略
CREATE POLICY "Users can view chats of own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM messages WHERE messages.id = chat_messages.message_id AND messages.user_id = auth.uid())
  );
CREATE POLICY "Users can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM messages WHERE messages.id = chat_messages.message_id AND messages.user_id = auth.uid())
  );

-- ============================================================
-- 自动创建用户资料触发器（注册后自动创建 profile）
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 种子数据（示例宠物）
-- ============================================================
INSERT INTO pets (name, breed, age, weight, gender, location, distance, image_url, description, personality, status, type, category, vaccination, neutered, microchipped)
VALUES
  ('Milo', '黄金猎犬', '2岁', '25kg', '公', '阳光流浪动物救助站, CA', '2.5 公里',
   'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
   'Milo 是最典型的黄金猎犬：忠诚、热情，而且永远快快乐乐。他在山谷附近被发现时是一只流浪犬，但很快就成了救助站的宠儿。',
   ARRAY['友好', '对孩子友善', '热爱户外', '社交达人'], 'new', 'adoption', '狗狗', true, true, true),

  ('Luna', '暹罗混血', '1岁', '3.5kg', '母', '阳光流浪动物救助站, CA', '1.2 公里',
   'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800',
   'Luna 是一只优雅的暹罗混血猫，有着迷人的蓝眼睛。她非常聪明，喜欢在窗台晒太阳。',
   ARRAY['优雅', '聪明', '安静'], 'urgent', 'adoption', '猫咪', true, true, true),

  ('Teddy', '荷兰垂耳兔', '6个月', '1.2kg', '公', '阳光流浪动物救助站, CA', '4.8 公里',
   'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800',
   'Teddy 是一只超级蓬松的荷兰垂耳兔，性格温顺，喜欢吃新鲜的胡萝卜。',
   ARRAY['温顺', '蓬松', '可爱'], 'none', 'adoption', '兔子', true, false, false)

ON CONFLICT DO NOTHING;
