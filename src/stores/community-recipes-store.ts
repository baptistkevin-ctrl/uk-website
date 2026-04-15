import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CommunityRecipeIngredient {
  name: string
  quantity: string
  unit: string
  searchTerm: string
}

export interface CommunityRecipe {
  id: string
  title: string
  description: string
  imageUrl: string
  authorId: string
  authorName: string
  authorAvatar?: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisine: string
  dietary: string[]
  categories: string[]
  ingredients: CommunityRecipeIngredient[]
  steps: string[]
  tips: string[]
  upvotes: number
  downvotes: number
  commentCount: number
  createdAt: string
  status: 'published' | 'pending' | 'rejected'
}

export interface RecipeComment {
  id: string
  recipeId: string
  authorId: string
  authorName: string
  message: string
  rating: number
  photoUrl?: string
  createdAt: string
}

interface CommunityRecipesStore {
  recipes: CommunityRecipe[]
  comments: Record<string, RecipeComment[]>
  userVotes: Record<string, 'up' | 'down'>

  addRecipe: (recipe: Omit<CommunityRecipe, 'id' | 'upvotes' | 'downvotes' | 'commentCount' | 'createdAt' | 'status'>) => CommunityRecipe
  removeRecipe: (recipeId: string) => void
  getRecipe: (recipeId: string) => CommunityRecipe | null
  getRecipesByAuthor: (authorId: string) => CommunityRecipe[]

  upvote: (recipeId: string) => void
  downvote: (recipeId: string) => void
  removeVote: (recipeId: string) => void

  addComment: (recipeId: string, comment: Omit<RecipeComment, 'id' | 'createdAt'>) => void
  getComments: (recipeId: string) => RecipeComment[]

  getTopRecipes: (limit?: number) => CommunityRecipe[]
  getRecipeOfTheWeek: () => CommunityRecipe | null
  searchRecipes: (query: string) => CommunityRecipe[]
  filterByCategory: (category: string) => CommunityRecipe[]
  filterByDietary: (dietary: string) => CommunityRecipe[]
}

const DEMO_RECIPES: CommunityRecipe[] = [
  {
    id: 'cr-1',
    title: 'One-Pot Chicken Pasta',
    description: 'Super easy weeknight dinner — everything cooks in one pot!',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    authorId: 'demo-1',
    authorName: 'Sarah K.',
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Italian',
    dietary: [],
    categories: ['Quick Meals', 'Family Dinner'],
    ingredients: [
      { name: 'Chicken Breast', quantity: '500', unit: 'g', searchTerm: 'chicken breast' },
      { name: 'Penne Pasta', quantity: '400', unit: 'g', searchTerm: 'penne pasta' },
      { name: 'Chopped Tomatoes', quantity: '400', unit: 'g', searchTerm: 'chopped tomatoes' },
      { name: 'Garlic', quantity: '3', unit: 'cloves', searchTerm: 'garlic' },
      { name: 'Spinach', quantity: '100', unit: 'g', searchTerm: 'spinach' },
      { name: 'Parmesan', quantity: '50', unit: 'g', searchTerm: 'parmesan' },
    ],
    steps: [
      'Dice chicken and fry until golden.',
      'Add garlic, cook 1 min.',
      'Add tomatoes, pasta, and 500ml water.',
      'Simmer 15 min until pasta is cooked.',
      'Stir in spinach, top with parmesan.',
    ],
    tips: ['Add chilli flakes for heat'],
    upvotes: 47,
    downvotes: 2,
    commentCount: 12,
    createdAt: '2026-03-15T10:00:00Z',
    status: 'published',
  },
  {
    id: 'cr-2',
    title: '15-Minute Veggie Stir Fry',
    description: 'A colourful, crunchy stir fry packed with vegetables. Ready in under 15 minutes!',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
    authorId: 'demo-2',
    authorName: 'James T.',
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Asian',
    dietary: ['Vegan'],
    categories: ['Quick Meals', 'Healthy'],
    ingredients: [
      { name: 'Broccoli', quantity: '200', unit: 'g', searchTerm: 'broccoli' },
      { name: 'Red Pepper', quantity: '1', unit: 'whole', searchTerm: 'red pepper' },
      { name: 'Pak Choi', quantity: '2', unit: 'heads', searchTerm: 'pak choi' },
      { name: 'Soy Sauce', quantity: '3', unit: 'tbsp', searchTerm: 'soy sauce' },
      { name: 'Sesame Oil', quantity: '1', unit: 'tbsp', searchTerm: 'sesame oil' },
      { name: 'Fresh Ginger', quantity: '1', unit: 'thumb', searchTerm: 'ginger' },
      { name: 'Rice Noodles', quantity: '200', unit: 'g', searchTerm: 'rice noodles' },
    ],
    steps: [
      'Cook rice noodles according to packet instructions.',
      'Heat sesame oil in a wok over high heat.',
      'Add ginger and stir-fry 30 seconds.',
      'Add broccoli and pepper, stir-fry 3 min.',
      'Add pak choi and soy sauce, cook 2 min.',
      'Toss with noodles and serve.',
    ],
    tips: ['Add sriracha or chilli oil for extra kick', 'Swap noodles for rice if preferred'],
    upvotes: 38,
    downvotes: 1,
    commentCount: 8,
    createdAt: '2026-03-18T14:30:00Z',
    status: 'published',
  },
  {
    id: 'cr-3',
    title: 'Classic Sunday Roast',
    description: 'A proper British Sunday roast with all the trimmings. Perfect for the family.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    authorId: 'demo-3',
    authorName: 'Margaret W.',
    prepTime: 30,
    cookTime: 120,
    servings: 6,
    difficulty: 'Medium',
    cuisine: 'British',
    dietary: [],
    categories: ['Family Dinner', 'Weekend'],
    ingredients: [
      { name: 'Beef Topside', quantity: '1.5', unit: 'kg', searchTerm: 'beef topside' },
      { name: 'Maris Piper Potatoes', quantity: '1', unit: 'kg', searchTerm: 'maris piper potatoes' },
      { name: 'Carrots', quantity: '500', unit: 'g', searchTerm: 'carrots' },
      { name: 'Yorkshire Pudding Mix', quantity: '1', unit: 'pack', searchTerm: 'yorkshire pudding' },
      { name: 'Gravy Granules', quantity: '1', unit: 'pack', searchTerm: 'gravy granules' },
      { name: 'Frozen Peas', quantity: '300', unit: 'g', searchTerm: 'frozen peas' },
      { name: 'Goose Fat', quantity: '1', unit: 'jar', searchTerm: 'goose fat' },
    ],
    steps: [
      'Preheat oven to 200°C. Season beef and place in a roasting tin.',
      'Roast beef for 20 min per 500g plus 20 min for medium.',
      'Par-boil potatoes, drain and rough up edges. Roast in goose fat.',
      'Boil carrots and peas for the last 10 minutes.',
      'Make Yorkshire puddings according to packet instructions.',
      'Rest the beef 15 min, then make gravy from the pan juices.',
    ],
    tips: ['Rest the meat — it makes all the difference', 'Get the fat smoking hot before adding potatoes'],
    upvotes: 51,
    downvotes: 3,
    commentCount: 15,
    createdAt: '2026-03-10T09:00:00Z',
    status: 'published',
  },
  {
    id: 'cr-4',
    title: 'Homemade Hummus',
    description: 'Creamy, garlicky hummus made from scratch. So much better than shop-bought!',
    imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80',
    authorId: 'demo-4',
    authorName: 'Amira H.',
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Middle Eastern',
    dietary: ['Vegan'],
    categories: ['Snacks', 'Healthy'],
    ingredients: [
      { name: 'Chickpeas', quantity: '400', unit: 'g', searchTerm: 'chickpeas' },
      { name: 'Tahini', quantity: '3', unit: 'tbsp', searchTerm: 'tahini' },
      { name: 'Lemon', quantity: '1', unit: 'whole', searchTerm: 'lemon' },
      { name: 'Garlic', quantity: '2', unit: 'cloves', searchTerm: 'garlic' },
      { name: 'Olive Oil', quantity: '2', unit: 'tbsp', searchTerm: 'olive oil' },
      { name: 'Cumin', quantity: '1', unit: 'tsp', searchTerm: 'cumin' },
    ],
    steps: [
      'Drain and rinse chickpeas.',
      'Add chickpeas, tahini, lemon juice, garlic, and cumin to a food processor.',
      'Blend until smooth, adding cold water a tablespoon at a time.',
      'Drizzle with olive oil and sprinkle with paprika to serve.',
    ],
    tips: ['Use ice-cold water for extra smooth hummus', 'Peel the chickpeas for restaurant-quality texture'],
    upvotes: 29,
    downvotes: 0,
    commentCount: 6,
    createdAt: '2026-03-22T11:00:00Z',
    status: 'published',
  },
  {
    id: 'cr-5',
    title: 'Salmon Teriyaki Bowl',
    description: 'Glossy teriyaki salmon on fluffy rice with pickled veg. A midweek treat.',
    imageUrl: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&q=80',
    authorId: 'demo-5',
    authorName: 'Tom L.',
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Japanese',
    dietary: [],
    categories: ['Quick Meals', 'Healthy'],
    ingredients: [
      { name: 'Salmon Fillets', quantity: '2', unit: 'fillets', searchTerm: 'salmon fillets' },
      { name: 'Soy Sauce', quantity: '3', unit: 'tbsp', searchTerm: 'soy sauce' },
      { name: 'Honey', quantity: '2', unit: 'tbsp', searchTerm: 'honey' },
      { name: 'Rice Vinegar', quantity: '1', unit: 'tbsp', searchTerm: 'rice vinegar' },
      { name: 'Jasmine Rice', quantity: '200', unit: 'g', searchTerm: 'jasmine rice' },
      { name: 'Cucumber', quantity: '1', unit: 'whole', searchTerm: 'cucumber' },
      { name: 'Spring Onions', quantity: '3', unit: 'whole', searchTerm: 'spring onions' },
    ],
    steps: [
      'Cook jasmine rice according to packet instructions.',
      'Mix soy sauce, honey, and rice vinegar for the teriyaki glaze.',
      'Pan-fry salmon skin-side down for 4 min, flip and cook 3 min.',
      'Pour glaze over salmon and cook 1 min until sticky.',
      'Slice cucumber into ribbons. Assemble bowls with rice, salmon, and veg.',
    ],
    tips: ['Pat salmon dry before frying for crispy skin'],
    upvotes: 42,
    downvotes: 1,
    commentCount: 9,
    createdAt: '2026-03-20T16:00:00Z',
    status: 'published',
  },
  {
    id: 'cr-6',
    title: 'Shakshuka',
    description: 'Spiced tomato sauce with perfectly poached eggs. Great for brunch or a light dinner.',
    imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&q=80',
    authorId: 'demo-6',
    authorName: 'Leila B.',
    prepTime: 10,
    cookTime: 20,
    servings: 3,
    difficulty: 'Easy',
    cuisine: 'Middle Eastern',
    dietary: ['Vegetarian'],
    categories: ['Breakfast', 'Quick Meals'],
    ingredients: [
      { name: 'Chopped Tomatoes', quantity: '800', unit: 'g', searchTerm: 'chopped tomatoes' },
      { name: 'Eggs', quantity: '4', unit: 'whole', searchTerm: 'free range eggs' },
      { name: 'Red Onion', quantity: '1', unit: 'whole', searchTerm: 'red onion' },
      { name: 'Red Pepper', quantity: '1', unit: 'whole', searchTerm: 'red pepper' },
      { name: 'Cumin', quantity: '1', unit: 'tsp', searchTerm: 'cumin' },
      { name: 'Smoked Paprika', quantity: '1', unit: 'tsp', searchTerm: 'smoked paprika' },
      { name: 'Fresh Coriander', quantity: '1', unit: 'bunch', searchTerm: 'fresh coriander' },
      { name: 'Crusty Bread', quantity: '1', unit: 'loaf', searchTerm: 'sourdough bread' },
    ],
    steps: [
      'Fry diced onion and pepper in olive oil for 5 min.',
      'Add cumin and paprika, cook 1 min.',
      'Pour in chopped tomatoes, season and simmer 10 min.',
      'Make wells and crack eggs into the sauce.',
      'Cover and cook 5-6 min until whites are set.',
      'Scatter coriander and serve with crusty bread.',
    ],
    tips: ['Don\'t stir the eggs once cracked in', 'Add crumbled feta for extra richness'],
    upvotes: 35,
    downvotes: 2,
    commentCount: 11,
    createdAt: '2026-03-25T08:00:00Z',
    status: 'published',
  },
  {
    id: 'cr-7',
    title: 'Beef Chilli Con Carne',
    description: 'Rich, smoky beef chilli slow-cooked with kidney beans. Freezes beautifully.',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80',
    authorId: 'demo-7',
    authorName: 'Dave R.',
    prepTime: 15,
    cookTime: 60,
    servings: 6,
    difficulty: 'Medium',
    cuisine: 'Mexican',
    dietary: [],
    categories: ['Family Dinner', 'Batch Cooking'],
    ingredients: [
      { name: 'Beef Mince', quantity: '500', unit: 'g', searchTerm: 'beef mince' },
      { name: 'Kidney Beans', quantity: '400', unit: 'g', searchTerm: 'kidney beans' },
      { name: 'Chopped Tomatoes', quantity: '400', unit: 'g', searchTerm: 'chopped tomatoes' },
      { name: 'Onion', quantity: '2', unit: 'whole', searchTerm: 'onion' },
      { name: 'Chilli Powder', quantity: '2', unit: 'tsp', searchTerm: 'chilli powder' },
      { name: 'Smoked Paprika', quantity: '1', unit: 'tsp', searchTerm: 'smoked paprika' },
      { name: 'Soured Cream', quantity: '150', unit: 'ml', searchTerm: 'soured cream' },
      { name: 'Long Grain Rice', quantity: '300', unit: 'g', searchTerm: 'long grain rice' },
    ],
    steps: [
      'Brown the mince in a large pan, drain excess fat.',
      'Fry diced onions until soft, add chilli powder and paprika.',
      'Add tomatoes and kidney beans, stir well.',
      'Simmer on low for 45-60 min, stirring occasionally.',
      'Season to taste. Serve with rice and soured cream.',
    ],
    tips: ['Add a square of dark chocolate for depth', 'Even better the next day — great for meal prep'],
    upvotes: 44,
    downvotes: 3,
    commentCount: 14,
    createdAt: '2026-03-12T12:00:00Z',
    status: 'published',
  },
  {
    id: 'cr-8',
    title: 'Banana Oat Pancakes',
    description: 'Fluffy, healthy pancakes with just 3 main ingredients. Kids love them!',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    authorId: 'demo-8',
    authorName: 'Emily C.',
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'British',
    dietary: ['Vegetarian'],
    categories: ['Breakfast', 'Quick Meals', 'Healthy'],
    ingredients: [
      { name: 'Bananas', quantity: '2', unit: 'whole', searchTerm: 'bananas' },
      { name: 'Rolled Oats', quantity: '80', unit: 'g', searchTerm: 'rolled oats' },
      { name: 'Eggs', quantity: '2', unit: 'whole', searchTerm: 'free range eggs' },
      { name: 'Baking Powder', quantity: '1', unit: 'tsp', searchTerm: 'baking powder' },
      { name: 'Mixed Berries', quantity: '150', unit: 'g', searchTerm: 'mixed berries' },
      { name: 'Maple Syrup', quantity: '2', unit: 'tbsp', searchTerm: 'maple syrup' },
    ],
    steps: [
      'Blend bananas, oats, eggs, and baking powder until smooth.',
      'Heat a non-stick pan over medium heat with a little butter.',
      'Pour small circles of batter and cook 2 min each side.',
      'Stack pancakes and top with berries and maple syrup.',
    ],
    tips: ['Add a pinch of cinnamon to the batter', 'Use a blender for the smoothest batter'],
    upvotes: 33,
    downvotes: 1,
    commentCount: 7,
    createdAt: '2026-03-28T07:30:00Z',
    status: 'published',
  },
]

function generateId(): string {
  return `cr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateCommentId(): string {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useCommunityRecipesStore = create<CommunityRecipesStore>()(
  persist(
    (set, get) => ({
      recipes: DEMO_RECIPES,
      comments: {},
      userVotes: {},

      addRecipe: (recipeData) => {
        const newRecipe: CommunityRecipe = {
          ...recipeData,
          id: generateId(),
          upvotes: 0,
          downvotes: 0,
          commentCount: 0,
          createdAt: new Date().toISOString(),
          status: 'published',
        }

        set((state) => ({
          recipes: [newRecipe, ...state.recipes],
        }))

        return newRecipe
      },

      removeRecipe: (recipeId) => {
        set((state) => {
          const { [recipeId]: _removed, ...remainingComments } = state.comments
          const { [recipeId]: _removedVote, ...remainingVotes } = state.userVotes

          return {
            recipes: state.recipes.filter((r) => r.id !== recipeId),
            comments: remainingComments,
            userVotes: remainingVotes,
          }
        })
      },

      getRecipe: (recipeId) => {
        return get().recipes.find((r) => r.id === recipeId) ?? null
      },

      getRecipesByAuthor: (authorId) => {
        return get().recipes.filter((r) => r.authorId === authorId)
      },

      upvote: (recipeId) => {
        const { userVotes } = get()
        const currentVote = userVotes[recipeId]

        set((state) => {
          const updatedRecipes = state.recipes.map((r) => {
            if (r.id !== recipeId) return r

            if (currentVote === 'up') return r
            if (currentVote === 'down') {
              return { ...r, upvotes: r.upvotes + 1, downvotes: r.downvotes - 1 }
            }
            return { ...r, upvotes: r.upvotes + 1 }
          })

          return {
            recipes: updatedRecipes,
            userVotes: { ...state.userVotes, [recipeId]: 'up' },
          }
        })
      },

      downvote: (recipeId) => {
        const { userVotes } = get()
        const currentVote = userVotes[recipeId]

        set((state) => {
          const updatedRecipes = state.recipes.map((r) => {
            if (r.id !== recipeId) return r

            if (currentVote === 'down') return r
            if (currentVote === 'up') {
              return { ...r, downvotes: r.downvotes + 1, upvotes: r.upvotes - 1 }
            }
            return { ...r, downvotes: r.downvotes + 1 }
          })

          return {
            recipes: updatedRecipes,
            userVotes: { ...state.userVotes, [recipeId]: 'down' },
          }
        })
      },

      removeVote: (recipeId) => {
        const { userVotes } = get()
        const currentVote = userVotes[recipeId]
        if (!currentVote) return

        set((state) => {
          const updatedRecipes = state.recipes.map((r) => {
            if (r.id !== recipeId) return r

            if (currentVote === 'up') {
              return { ...r, upvotes: r.upvotes - 1 }
            }
            return { ...r, downvotes: r.downvotes - 1 }
          })

          const { [recipeId]: _removed, ...remainingVotes } = state.userVotes

          return {
            recipes: updatedRecipes,
            userVotes: remainingVotes,
          }
        })
      },

      addComment: (recipeId, commentData) => {
        const newComment: RecipeComment = {
          ...commentData,
          id: generateCommentId(),
          createdAt: new Date().toISOString(),
        }

        set((state) => {
          const existing = state.comments[recipeId] ?? []
          const updatedRecipes = state.recipes.map((r) =>
            r.id === recipeId ? { ...r, commentCount: r.commentCount + 1 } : r
          )

          return {
            comments: { ...state.comments, [recipeId]: [...existing, newComment] },
            recipes: updatedRecipes,
          }
        })
      },

      getComments: (recipeId) => {
        return get().comments[recipeId] ?? []
      },

      getTopRecipes: (limit = 10) => {
        return [...get().recipes]
          .filter((r) => r.status === 'published')
          .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
          .slice(0, limit)
      },

      getRecipeOfTheWeek: () => {
        const published = get().recipes.filter((r) => r.status === 'published')
        if (published.length === 0) return null

        const now = new Date()
        const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
        const index = weekNumber % published.length

        return [...published].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))[index] ?? null
      },

      searchRecipes: (query) => {
        const lower = query.toLowerCase()

        return get().recipes.filter((r) =>
          r.status === 'published' && (
            r.title.toLowerCase().includes(lower) ||
            r.description.toLowerCase().includes(lower) ||
            r.cuisine.toLowerCase().includes(lower) ||
            r.ingredients.some((i) => i.name.toLowerCase().includes(lower)) ||
            r.categories.some((c) => c.toLowerCase().includes(lower))
          )
        )
      },

      filterByCategory: (category) => {
        return get().recipes.filter(
          (r) => r.status === 'published' && r.categories.some((c) => c.toLowerCase() === category.toLowerCase())
        )
      },

      filterByDietary: (dietary) => {
        return get().recipes.filter(
          (r) => r.status === 'published' && r.dietary.some((d) => d.toLowerCase() === dietary.toLowerCase())
        )
      },
    }),
    {
      name: 'community-recipes-storage',
    }
  )
)
