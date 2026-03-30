import { Pet, Application, Message } from './types';

export const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Milo',
    breed: '黄金猎犬',
    age: '2岁',
    weight: '25kg',
    gender: '公',
    location: '阳光流浪动物救助站, CA',
    distance: '2.5 公里',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIrcX_YsstMs9s-SWKsVw5mBObsfqWZmNmjMLUxgwacrEvacEYtO71kEpCSvijxdQgLQqb_0bCNRrfC5dj2HeHtHyx6Klvc3-pw3HHcmuERERbNwkJ4SE--6zV1piHehduo8TOWpWNFrdtU7EcdQEPjqPyFX3OOXwROsaNMZfY9KD9xrXsGClaF02Up5xUqczag2oHkbf8tV_56PwCJ2olHwaGBh4YF4sx_gyCunXrJuswlEWMu8jsXzLcoTADzHvonCQzF-YWnSK2',
    description: 'Buddy 是最典型的黄金猎犬：忠诚、热情，而且永远快快乐乐。他在山谷附近被发现时是一只流浪犬，但很快就成了我们救助站的宠儿。他性格沉稳自信，无论是面对精力充沛的小朋友，还是喜欢安静的长辈，他都是绝佳的伴侣。',
    personality: ['友好', '对孩子友善', '热爱户外', '社交达人'],
    status: 'new',
    type: 'adoption',
    category: '狗狗',
    healthStatus: {
      vaccination: true,
      neutered: true,
      microchipped: true
    }
  },
  {
    id: '2',
    name: 'Luna',
    breed: '暹罗混血',
    age: '1岁',
    location: '阳光流浪动物救助站, CA',
    distance: '1.2 公里',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBf-EyMRIW6x9FelzSHvegMGtP8TwmsweyQcpTXKX5gunH7sfNpHDt514CSAaiue9CYJJ5EMEtFULjmOL26fUFr68ZCMh5xTtHcpsG-marZJ35Wvc8XVb4-M9EzqAoty4ub5RLh_emlF29zhCf-Zjs_NqDtVEUOqM-z0ksck0MuJRgo8pf_NRqcVZFD0vwCJNyrZIt3pZK_U9PA0uSt-P_GH3_wwYjKhPnYWqVo_Y53cokLrXKQg1iDVxRSW3NF3URCIrZVwxw93aXm',
    description: 'Luna 是一只优雅的暹罗混血猫，有着迷人的蓝眼睛。她非常聪明，喜欢在窗台晒太阳。',
    personality: ['优雅', '聪明', '安静'],
    status: 'urgent',
    type: 'adoption',
    category: '猫咪',
    healthStatus: {
      vaccination: true,
      neutered: true,
      microchipped: true
    }
  },
  {
    id: '3',
    name: 'Teddy',
    breed: '荷兰垂耳兔',
    age: '6个月',
    location: '阳光流浪动物救助站, CA',
    distance: '4.8 公里',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD42lSK1cX6kK1j_VrNNatisLTEk_44HqpqM__0RX1XRhsOl9M2N1bPDClc47hZlp6Rl-ksYtCgEx4kCxhZ-oPIUkHbxb-07-T9599epUDvfwpg6f16gHgyxhRDlXGcExkgbiy3bdDmccgLRJahbpAJw3GhM0DF1yW8a_U3fHgTrui4nTiQDDYBsMjliXb8b66zAFbeQP5AbrwNS8sUX85vn1GWtlR2hgba7qXhT4r54WqgSj7Zoz8ikCo25O81U6GR3dlo1CRC7BeX',
    description: 'Teddy 是一只超级蓬松的荷兰垂耳兔，性格温顺，喜欢吃新鲜的胡萝卜。',
    personality: ['温顺', '蓬松', '可爱'],
    status: 'none',
    type: 'adoption',
    category: '兔子',
    healthStatus: {
      vaccination: true,
      neutered: false,
      microchipped: false
    }
  },
  {
    id: '4',
    name: '糯米',
    breed: '萨摩耶',
    age: '1岁',
    location: '上海, 静安区',
    distance: '0.8 公里',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sR8m9YvX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX',
    description: '糯米是一只非常听话的萨摩耶，因为主人出差需要寻找临时寄养家庭。',
    personality: ['听话', '爱笑', '不拆家'],
    status: 'new',
    type: 'foster',
    category: '狗狗',
    fostererName: '艾琳娜·凡斯',
    healthStatus: {
      vaccination: true,
      neutered: true,
      microchipped: true
    }
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'a1',
    petName: 'Benson',
    petBreed: '金毛猎犬',
    petAge: '4个月',
    petImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxJOLca2vGb2Wh2uVft0xU0RAAn3PyCU3YguSopppC2KFU6n_3bZc0oqlA1H3td-Y-MsVI5ZYGgbjlrc9T6sBxnWAwaatst6R-x_C2jFEFrAhQqhKarGpX6e_VxBAF_HunIi1Uu20TqFVYmrjr_VhIVgwIBUNSuns8LvYYOm3lWGIL598dE05T0vU2_r_2kR_VrIOnZLFOj4dLBGf2KOVThFXQFfpDsYmHWq44Gf5R-0AC3DsXAlgZyXcCQbJ8M96upiURhAtBEiqo',
    status: 'approved',
    type: 'adoption'
  },
  {
    id: 'a2',
    petName: 'Mochi',
    petBreed: '法斗',
    petAge: '2岁',
    petImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSoNq7dG0EjsTvV8Qq2xuXSSF4RL9Lj8H2KTG8O7uTf0hnZyhJdHmZxf9XkrMB0I8mi9MERXW6kNmDy4mvlYy5KhmvN-W7Poh3O8tOy1E49frtm5gGvzSKgyUFr8D3UBMHM8zXVVSc6C5TuVlA0ElO2cKnxEN4DlBWZeFftpsx3d9cl27gR_zaPY34I2qb9F0u33oY1p-PNzFBq3UeB1SsSNKeUbjW7ij8-51qFAYAteeDFDlqAOnNE47Ixg3lUKSiX2L19hhAdrkW',
    status: 'reviewing',
    type: 'adoption'
  },
  {
    id: 'fa1',
    petName: '糯米',
    petBreed: '萨摩耶',
    petAge: '1岁',
    petImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sR8m9YvX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX6vX',
    status: 'reviewing',
    type: 'foster',
    applicantName: '张三',
    applicantBio: '家里有一只拉布拉多，有丰富的养宠经验，可以提供良好的寄养环境。',
    petId: '4'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: '阳光流浪动物救助站',
    time: '上午 10:45',
    subject: '回复: Milo 的访问时间表',
    preview: '我们非常欢迎你这周六 10 点过来...',
    icon: 'potted_plant',
    isRead: false,
    type: 'adoption'
  },
  {
    id: 'm2',
    sender: '萌爪家园团队',
    time: '昨天',
    subject: '关于 Cooper 的申请',
    preview: '感谢您的关注。不幸的是 Cooper 已经...',
    icon: 'pets',
    isRead: true,
    type: 'adoption'
  },
  {
    id: 'm3',
    sender: '系统通知',
    time: '2天前',
    subject: '您的资料已更新',
    preview: '您的领养人资料已成功更新，现在您可以申请更多宠物了。',
    icon: 'bell',
    isRead: true,
    type: 'notification'
  },
  {
    id: 'm4',
    sender: '王小明',
    time: '3天前',
    subject: '赞了你的领养动态',
    preview: '王小明赞了你发布的关于 Milo 的动态。',
    icon: 'heart',
    isRead: false,
    type: 'interaction'
  }
];
