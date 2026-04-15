export interface RecipeIngredient {
  name: string
  quantity: string
  unit: string
  category: string
  searchTerm: string
  optional?: boolean
  perServing: number
}

export interface Recipe {
  id: string
  slug: string
  title: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: "Easy" | "Medium" | "Hard"
  cuisine: string
  dietary: string[]
  calories: number
  categories: string[]
  ingredients: RecipeIngredient[]
  steps: string[]
  tips?: string[]
  author: string
}

export const RECIPES: Recipe[] = [
  {
    id: "1",
    slug: "classic-chicken-stir-fry",
    title: "Classic Chicken Stir Fry",
    description:
      "A quick and healthy weeknight dinner packed with colorful vegetables and tender chicken strips in a savoury soy-ginger sauce.",
    imageUrl:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: "Easy",
    cuisine: "Asian",
    dietary: ["gluten-free", "dairy-free"],
    calories: 380,
    categories: ["Quick Meals", "Healthy", "Family Dinner"],
    ingredients: [
      { name: "Chicken Breast", quantity: "500g", unit: "g", category: "Meat", searchTerm: "chicken breast", perServing: 125 },
      { name: "Bell Peppers", quantity: "2", unit: "pieces", category: "Fresh Produce", searchTerm: "bell peppers", perServing: 0.5 },
      { name: "Broccoli", quantity: "1 head", unit: "pieces", category: "Fresh Produce", searchTerm: "broccoli", perServing: 0.25 },
      { name: "Soy Sauce", quantity: "3 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "soy sauce", perServing: 0.75 },
      { name: "Garlic", quantity: "3 cloves", unit: "cloves", category: "Fresh Produce", searchTerm: "garlic", perServing: 0.75 },
      { name: "Fresh Ginger", quantity: "1 inch", unit: "pieces", category: "Fresh Produce", searchTerm: "ginger", perServing: 0.25 },
      { name: "Sesame Oil", quantity: "1 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "sesame oil", perServing: 0.25 },
      { name: "Rice", quantity: "300g", unit: "g", category: "Pantry", searchTerm: "rice", perServing: 75 },
    ],
    steps: [
      "Slice chicken breast into thin strips and season with salt and pepper.",
      "Chop all vegetables into bite-sized pieces.",
      "Heat sesame oil in a large wok over high heat.",
      "Cook chicken for 4-5 minutes until golden. Remove and set aside.",
      "Add vegetables to the wok and stir-fry for 3-4 minutes until crisp-tender.",
      "Return chicken to the wok, add soy sauce and ginger.",
      "Toss everything together and serve over steamed rice.",
    ],
    tips: [
      "Use a very hot wok for the best stir-fry.",
      "Prep all ingredients before you start cooking.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "2",
    slug: "spaghetti-bolognese",
    title: "Spaghetti Bolognese",
    description:
      "A rich, slow-simmered meat sauce with tomatoes, herbs and a hint of red wine served over al dente spaghetti.",
    imageUrl:
      "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=800&q=80",
    prepTime: 10,
    cookTime: 35,
    servings: 4,
    difficulty: "Easy",
    cuisine: "Italian",
    dietary: ["halal"],
    calories: 520,
    categories: ["Family Dinner", "Comfort Food", "Budget Friendly"],
    ingredients: [
      { name: "Spaghetti", quantity: "400g", unit: "g", category: "Pantry", searchTerm: "spaghetti", perServing: 100 },
      { name: "Beef Mince", quantity: "500g", unit: "g", category: "Meat", searchTerm: "beef mince", perServing: 125 },
      { name: "Tinned Chopped Tomatoes", quantity: "400g", unit: "g", category: "Pantry", searchTerm: "chopped tomatoes", perServing: 100 },
      { name: "Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "onion", perServing: 0.25 },
      { name: "Garlic", quantity: "3 cloves", unit: "cloves", category: "Fresh Produce", searchTerm: "garlic", perServing: 0.75 },
      { name: "Carrot", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "carrot", perServing: 0.25 },
      { name: "Celery", quantity: "1 stick", unit: "pieces", category: "Fresh Produce", searchTerm: "celery", perServing: 0.25 },
      { name: "Tomato Puree", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "tomato puree", perServing: 0.5 },
      { name: "Olive Oil", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "olive oil", perServing: 0.5 },
      { name: "Parmesan Cheese", quantity: "50g", unit: "g", category: "Dairy", searchTerm: "parmesan", optional: true, perServing: 12.5 },
    ],
    steps: [
      "Finely dice the onion, carrot and celery.",
      "Heat olive oil in a large pan and cook the diced veg for 5 minutes until softened.",
      "Add garlic and cook for another minute.",
      "Add beef mince and brown for 5-6 minutes, breaking it apart.",
      "Stir in tomato puree and cook for 1 minute.",
      "Pour in tinned tomatoes, season with salt, pepper and a pinch of sugar.",
      "Simmer on low heat for 20 minutes, stirring occasionally.",
      "Cook spaghetti in salted boiling water according to pack instructions.",
      "Drain pasta, serve topped with the bolognese sauce and grated parmesan.",
    ],
    tips: [
      "A splash of red wine added with the tomatoes deepens the flavour.",
      "Simmer longer for an even richer sauce.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "3",
    slug: "vegetable-curry",
    title: "Vegetable Curry",
    description:
      "A fragrant and creamy Indian-spiced curry loaded with seasonal vegetables and served with fluffy basmati rice.",
    imageUrl:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: "Medium",
    cuisine: "Indian",
    dietary: ["vegetarian", "gluten-free"],
    calories: 340,
    categories: ["Healthy", "Budget Friendly", "Comfort Food"],
    ingredients: [
      { name: "Chickpeas", quantity: "400g tin", unit: "g", category: "Pantry", searchTerm: "chickpeas", perServing: 100 },
      { name: "Coconut Milk", quantity: "400ml", unit: "ml", category: "Pantry", searchTerm: "coconut milk", perServing: 100 },
      { name: "Sweet Potato", quantity: "2 medium", unit: "pieces", category: "Fresh Produce", searchTerm: "sweet potato", perServing: 0.5 },
      { name: "Spinach", quantity: "200g", unit: "g", category: "Fresh Produce", searchTerm: "spinach", perServing: 50 },
      { name: "Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "onion", perServing: 0.25 },
      { name: "Garlic", quantity: "3 cloves", unit: "cloves", category: "Fresh Produce", searchTerm: "garlic", perServing: 0.75 },
      { name: "Curry Powder", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "curry powder", perServing: 0.5 },
      { name: "Basmati Rice", quantity: "300g", unit: "g", category: "Pantry", searchTerm: "basmati rice", perServing: 75 },
      { name: "Vegetable Oil", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "vegetable oil", perServing: 0.5 },
    ],
    steps: [
      "Peel and dice sweet potatoes into 2cm cubes.",
      "Dice the onion and mince garlic.",
      "Heat oil in a large pot and cook onion for 4 minutes until translucent.",
      "Add garlic and curry powder, cook for 1 minute until fragrant.",
      "Add sweet potato and stir to coat in spices.",
      "Pour in coconut milk and drained chickpeas, bring to a simmer.",
      "Cook for 20 minutes until sweet potato is tender.",
      "Stir in spinach and cook until wilted, about 2 minutes.",
      "Serve over basmati rice with a squeeze of lime.",
    ],
    tips: [
      "Add a teaspoon of garam masala at the end for extra warmth.",
      "Top with fresh coriander and a dollop of yoghurt.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "4",
    slug: "fish-and-chips",
    title: "Fish & Chips",
    description:
      "Crispy beer-battered cod with golden chunky chips and mushy peas — the ultimate British classic.",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: "Easy",
    cuisine: "British",
    dietary: [],
    calories: 620,
    categories: ["Comfort Food", "Family Dinner"],
    ingredients: [
      { name: "Cod Fillets", quantity: "4", unit: "pieces", category: "Meat", searchTerm: "cod fillet", perServing: 1 },
      { name: "Potatoes", quantity: "800g", unit: "g", category: "Fresh Produce", searchTerm: "potatoes", perServing: 200 },
      { name: "Plain Flour", quantity: "200g", unit: "g", category: "Pantry", searchTerm: "plain flour", perServing: 50 },
      { name: "Beer", quantity: "250ml", unit: "ml", category: "Pantry", searchTerm: "beer", perServing: 62.5 },
      { name: "Baking Powder", quantity: "1 tsp", unit: "tsp", category: "Pantry", searchTerm: "baking powder", perServing: 0.25 },
      { name: "Mushy Peas", quantity: "300g", unit: "g", category: "Pantry", searchTerm: "mushy peas", perServing: 75 },
      { name: "Sunflower Oil", quantity: "500ml", unit: "ml", category: "Pantry", searchTerm: "sunflower oil", perServing: 125 },
      { name: "Lemon", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "lemon", perServing: 0.25 },
    ],
    steps: [
      "Peel potatoes and cut into thick chips. Rinse and pat dry.",
      "Par-boil chips in salted water for 5 minutes, then drain and dry.",
      "Mix flour, baking powder and a pinch of salt. Whisk in beer until smooth.",
      "Heat oil to 180°C in a deep pan or fryer.",
      "Fry chips for 5-6 minutes until golden. Drain and keep warm.",
      "Dust cod fillets in flour, then dip into the batter.",
      "Fry fish for 4-5 minutes until golden and crispy.",
      "Serve with chips, mushy peas and a lemon wedge.",
    ],
    tips: [
      "Double-frying the chips gives extra crispiness.",
      "Keep the batter ice-cold for the crispiest coating.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "5",
    slug: "greek-salad",
    title: "Greek Salad",
    description:
      "A refreshing Mediterranean salad with ripe tomatoes, cucumber, olives, red onion and crumbled feta dressed in olive oil.",
    imageUrl:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    difficulty: "Easy",
    cuisine: "Mediterranean",
    dietary: ["vegetarian", "gluten-free"],
    calories: 220,
    categories: ["Quick Meals", "Healthy", "Budget Friendly"],
    ingredients: [
      { name: "Tomatoes", quantity: "4 large", unit: "pieces", category: "Fresh Produce", searchTerm: "tomatoes", perServing: 1 },
      { name: "Cucumber", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "cucumber", perServing: 0.25 },
      { name: "Red Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "red onion", perServing: 0.25 },
      { name: "Feta Cheese", quantity: "200g", unit: "g", category: "Dairy", searchTerm: "feta cheese", perServing: 50 },
      { name: "Kalamata Olives", quantity: "100g", unit: "g", category: "Pantry", searchTerm: "olives", perServing: 25 },
      { name: "Extra Virgin Olive Oil", quantity: "3 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "olive oil", perServing: 0.75 },
      { name: "Dried Oregano", quantity: "1 tsp", unit: "tsp", category: "Pantry", searchTerm: "oregano", perServing: 0.25 },
    ],
    steps: [
      "Cut tomatoes into wedges and slice cucumber into half-moons.",
      "Thinly slice the red onion into rings.",
      "Combine tomatoes, cucumber and onion in a large bowl.",
      "Add olives and crumble feta on top.",
      "Drizzle with olive oil and sprinkle dried oregano.",
      "Season with salt and pepper, toss gently and serve.",
    ],
    tips: [
      "Use the ripest tomatoes you can find for the best flavour.",
      "Let the salad sit for 10 minutes before serving so flavours meld.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "6",
    slug: "shepherds-pie",
    title: "Shepherd's Pie",
    description:
      "A hearty British classic with savoury lamb mince filling topped with creamy mashed potato and baked until golden.",
    imageUrl:
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80",
    prepTime: 20,
    cookTime: 40,
    servings: 6,
    difficulty: "Medium",
    cuisine: "British",
    dietary: ["halal"],
    calories: 480,
    categories: ["Family Dinner", "Comfort Food"],
    ingredients: [
      { name: "Lamb Mince", quantity: "500g", unit: "g", category: "Meat", searchTerm: "lamb mince", perServing: 83 },
      { name: "Potatoes", quantity: "1kg", unit: "g", category: "Fresh Produce", searchTerm: "potatoes", perServing: 167 },
      { name: "Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "onion", perServing: 0.17 },
      { name: "Carrots", quantity: "2", unit: "pieces", category: "Fresh Produce", searchTerm: "carrots", perServing: 0.33 },
      { name: "Frozen Peas", quantity: "150g", unit: "g", category: "Fresh Produce", searchTerm: "frozen peas", perServing: 25 },
      { name: "Butter", quantity: "50g", unit: "g", category: "Dairy", searchTerm: "butter", perServing: 8 },
      { name: "Milk", quantity: "100ml", unit: "ml", category: "Dairy", searchTerm: "milk", perServing: 17 },
      { name: "Tomato Puree", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "tomato puree", perServing: 0.33 },
      { name: "Worcestershire Sauce", quantity: "1 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "worcestershire sauce", perServing: 0.17 },
      { name: "Beef Stock", quantity: "300ml", unit: "ml", category: "Pantry", searchTerm: "beef stock", perServing: 50 },
    ],
    steps: [
      "Preheat oven to 200°C / 180°C fan.",
      "Peel and chop potatoes, boil for 15 minutes until tender.",
      "Meanwhile, brown lamb mince in a large pan, drain excess fat.",
      "Add diced onion and carrots, cook for 5 minutes.",
      "Stir in tomato puree, Worcestershire sauce and stock. Simmer for 15 minutes.",
      "Add frozen peas and cook for 2 more minutes.",
      "Drain potatoes, mash with butter and milk until smooth.",
      "Transfer meat filling to an oven dish, top with mashed potato.",
      "Fork the top for texture, bake for 20-25 minutes until golden.",
    ],
    tips: [
      "Use a fork to create ridges on the mash — they crisp up beautifully.",
      "Add a handful of grated cheddar on top before baking for extra indulgence.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "7",
    slug: "mushroom-risotto",
    title: "Mushroom Risotto",
    description:
      "A creamy Italian risotto with mixed mushrooms, white wine and parmesan, stirred to velvety perfection.",
    imageUrl:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    difficulty: "Medium",
    cuisine: "Italian",
    dietary: ["vegetarian"],
    calories: 420,
    categories: ["Comfort Food", "Family Dinner"],
    ingredients: [
      { name: "Arborio Rice", quantity: "300g", unit: "g", category: "Pantry", searchTerm: "arborio rice", perServing: 75 },
      { name: "Mixed Mushrooms", quantity: "300g", unit: "g", category: "Fresh Produce", searchTerm: "mushrooms", perServing: 75 },
      { name: "Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "onion", perServing: 0.25 },
      { name: "Garlic", quantity: "2 cloves", unit: "cloves", category: "Fresh Produce", searchTerm: "garlic", perServing: 0.5 },
      { name: "Vegetable Stock", quantity: "1 litre", unit: "ml", category: "Pantry", searchTerm: "vegetable stock", perServing: 250 },
      { name: "White Wine", quantity: "150ml", unit: "ml", category: "Pantry", searchTerm: "white wine", optional: true, perServing: 37.5 },
      { name: "Parmesan Cheese", quantity: "80g", unit: "g", category: "Dairy", searchTerm: "parmesan", perServing: 20 },
      { name: "Butter", quantity: "30g", unit: "g", category: "Dairy", searchTerm: "butter", perServing: 7.5 },
      { name: "Olive Oil", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "olive oil", perServing: 0.5 },
    ],
    steps: [
      "Heat stock in a saucepan and keep it at a gentle simmer.",
      "Heat olive oil and half the butter in a wide pan over medium heat.",
      "Sauté diced onion for 3 minutes, add garlic and cook 1 minute more.",
      "Add sliced mushrooms and cook for 5 minutes until golden.",
      "Add arborio rice, stir for 1 minute to toast the grains.",
      "Pour in white wine (if using) and stir until absorbed.",
      "Add stock one ladle at a time, stirring and waiting for each to absorb.",
      "Continue for 18-20 minutes until rice is creamy and al dente.",
      "Remove from heat, stir in remaining butter and parmesan. Rest 2 minutes.",
    ],
    tips: [
      "Never wash arborio rice — the starch creates the creamy texture.",
      "Use a mix of chestnut, shiitake and oyster mushrooms for depth.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "8",
    slug: "thai-green-curry",
    title: "Thai Green Curry",
    description:
      "A fragrant and spicy Thai curry with tender chicken, bamboo shoots and Thai basil in a rich coconut sauce.",
    imageUrl:
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80",
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: "Medium",
    cuisine: "Asian",
    dietary: ["gluten-free", "dairy-free"],
    calories: 450,
    categories: ["Quick Meals", "Family Dinner"],
    ingredients: [
      { name: "Chicken Thigh Fillets", quantity: "500g", unit: "g", category: "Meat", searchTerm: "chicken thighs", perServing: 125 },
      { name: "Coconut Milk", quantity: "400ml", unit: "ml", category: "Pantry", searchTerm: "coconut milk", perServing: 100 },
      { name: "Green Curry Paste", quantity: "3 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "green curry paste", perServing: 0.75 },
      { name: "Bamboo Shoots", quantity: "220g tin", unit: "g", category: "Pantry", searchTerm: "bamboo shoots", perServing: 55 },
      { name: "Green Beans", quantity: "150g", unit: "g", category: "Fresh Produce", searchTerm: "green beans", perServing: 37.5 },
      { name: "Fish Sauce", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "fish sauce", perServing: 0.5 },
      { name: "Brown Sugar", quantity: "1 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "brown sugar", perServing: 0.25 },
      { name: "Jasmine Rice", quantity: "300g", unit: "g", category: "Pantry", searchTerm: "jasmine rice", perServing: 75 },
      { name: "Lime", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "lime", perServing: 0.25 },
    ],
    steps: [
      "Slice chicken thighs into bite-sized pieces.",
      "Heat a tablespoon of coconut milk in a wok until it sizzles.",
      "Add green curry paste and fry for 1 minute until fragrant.",
      "Add chicken and cook for 3-4 minutes until sealed.",
      "Pour in the remaining coconut milk and bring to a simmer.",
      "Add bamboo shoots and green beans, cook for 8-10 minutes.",
      "Season with fish sauce and brown sugar, adjust to taste.",
      "Serve over jasmine rice with a squeeze of lime.",
    ],
    tips: [
      "Frying the curry paste in coconut cream releases the aromatics.",
      "Add Thai basil leaves at the end for an authentic finish.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "9",
    slug: "full-english-breakfast",
    title: "Full English Breakfast",
    description:
      "The ultimate British fry-up with bacon, sausages, eggs, beans, toast, tomatoes and mushrooms.",
    imageUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    prepTime: 5,
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    cuisine: "British",
    dietary: [],
    calories: 680,
    categories: ["Quick Meals", "Comfort Food"],
    ingredients: [
      { name: "Back Bacon", quantity: "4 rashers", unit: "pieces", category: "Meat", searchTerm: "bacon", perServing: 2 },
      { name: "Pork Sausages", quantity: "4", unit: "pieces", category: "Meat", searchTerm: "pork sausages", perServing: 2 },
      { name: "Free-Range Eggs", quantity: "4", unit: "pieces", category: "Dairy", searchTerm: "eggs", perServing: 2 },
      { name: "Baked Beans", quantity: "200g", unit: "g", category: "Pantry", searchTerm: "baked beans", perServing: 100 },
      { name: "Mushrooms", quantity: "100g", unit: "g", category: "Fresh Produce", searchTerm: "mushrooms", perServing: 50 },
      { name: "Tomatoes", quantity: "2", unit: "pieces", category: "Fresh Produce", searchTerm: "tomatoes", perServing: 1 },
      { name: "White Bread", quantity: "4 slices", unit: "pieces", category: "Bakery", searchTerm: "white bread", perServing: 2 },
      { name: "Butter", quantity: "20g", unit: "g", category: "Dairy", searchTerm: "butter", perServing: 10 },
    ],
    steps: [
      "Preheat grill to medium-high. Place sausages under grill for 12 minutes, turning.",
      "After 5 minutes, add bacon rashers to the grill pan.",
      "Halve tomatoes and add to the grill pan cut-side up.",
      "Heat beans in a small saucepan over low heat.",
      "Fry mushrooms in butter for 3-4 minutes in a frying pan.",
      "Push mushrooms aside and fry eggs to your liking.",
      "Toast the bread and butter generously.",
      "Plate everything up and serve immediately.",
    ],
    tips: [
      "Timing is everything — start with sausages as they take longest.",
      "A splash of HP sauce on the side is non-negotiable for purists.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "10",
    slug: "chickpea-spinach-stew",
    title: "Chickpea & Spinach Stew",
    description:
      "A warming vegan stew with spiced chickpeas, wilted spinach and crusty bread — packed with protein and flavour.",
    imageUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: "Easy",
    cuisine: "Mediterranean",
    dietary: ["vegan", "gluten-free", "dairy-free"],
    calories: 290,
    categories: ["Healthy", "Budget Friendly", "Quick Meals"],
    ingredients: [
      { name: "Chickpeas", quantity: "2 x 400g tins", unit: "g", category: "Pantry", searchTerm: "chickpeas", perServing: 200 },
      { name: "Spinach", quantity: "300g", unit: "g", category: "Fresh Produce", searchTerm: "spinach", perServing: 75 },
      { name: "Tinned Chopped Tomatoes", quantity: "400g", unit: "g", category: "Pantry", searchTerm: "chopped tomatoes", perServing: 100 },
      { name: "Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "onion", perServing: 0.25 },
      { name: "Garlic", quantity: "4 cloves", unit: "cloves", category: "Fresh Produce", searchTerm: "garlic", perServing: 1 },
      { name: "Smoked Paprika", quantity: "1 tsp", unit: "tsp", category: "Pantry", searchTerm: "smoked paprika", perServing: 0.25 },
      { name: "Cumin", quantity: "1 tsp", unit: "tsp", category: "Pantry", searchTerm: "cumin", perServing: 0.25 },
      { name: "Olive Oil", quantity: "2 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "olive oil", perServing: 0.5 },
      { name: "Crusty Bread", quantity: "1 loaf", unit: "pieces", category: "Bakery", searchTerm: "crusty bread", optional: true, perServing: 0.25 },
    ],
    steps: [
      "Dice onion and mince garlic cloves.",
      "Heat olive oil in a large pot over medium heat.",
      "Cook onion for 4 minutes, add garlic, paprika and cumin. Stir for 1 minute.",
      "Add drained chickpeas and tinned tomatoes. Stir to combine.",
      "Bring to a simmer and cook for 15 minutes until thickened.",
      "Stir in spinach in batches until fully wilted.",
      "Season with salt, pepper and a squeeze of lemon.",
      "Serve in bowls with crusty bread for dipping.",
    ],
    tips: [
      "Mash a few chickpeas against the side of the pot for a thicker stew.",
      "A drizzle of good olive oil on top before serving adds richness.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "11",
    slug: "salmon-roasted-vegetables",
    title: "Salmon with Roasted Vegetables",
    description:
      "Oven-baked salmon fillets with a medley of roasted Mediterranean vegetables — simple, elegant and healthy.",
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    difficulty: "Easy",
    cuisine: "Mediterranean",
    dietary: ["gluten-free", "dairy-free"],
    calories: 410,
    categories: ["Healthy", "Quick Meals", "Family Dinner"],
    ingredients: [
      { name: "Salmon Fillets", quantity: "4", unit: "pieces", category: "Meat", searchTerm: "salmon fillet", perServing: 1 },
      { name: "Courgette", quantity: "2", unit: "pieces", category: "Fresh Produce", searchTerm: "courgette", perServing: 0.5 },
      { name: "Red Pepper", quantity: "2", unit: "pieces", category: "Fresh Produce", searchTerm: "red pepper", perServing: 0.5 },
      { name: "Cherry Tomatoes", quantity: "250g", unit: "g", category: "Fresh Produce", searchTerm: "cherry tomatoes", perServing: 62.5 },
      { name: "Red Onion", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "red onion", perServing: 0.25 },
      { name: "Olive Oil", quantity: "3 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "olive oil", perServing: 0.75 },
      { name: "Lemon", quantity: "1", unit: "pieces", category: "Fresh Produce", searchTerm: "lemon", perServing: 0.25 },
      { name: "Fresh Dill", quantity: "1 bunch", unit: "bunch", category: "Fresh Produce", searchTerm: "fresh dill", optional: true, perServing: 0.25 },
    ],
    steps: [
      "Preheat oven to 200°C / 180°C fan.",
      "Chop courgette, red pepper and red onion into chunks.",
      "Toss vegetables with 2 tbsp olive oil, salt and pepper on a baking tray.",
      "Roast vegetables for 10 minutes.",
      "Place salmon fillets on top of the vegetables.",
      "Drizzle salmon with remaining olive oil and lemon juice.",
      "Return to oven and bake for 12-15 minutes until salmon is cooked through.",
      "Serve garnished with fresh dill and lemon wedges.",
    ],
    tips: [
      "Don't overcook the salmon — it should flake easily but remain moist.",
      "Add new potatoes to the tray for a complete one-pan meal.",
    ],
    author: "UK Grocery Kitchen",
  },
  {
    id: "12",
    slug: "banana-pancakes",
    title: "Banana Pancakes",
    description:
      "Fluffy golden pancakes with sweet mashed banana, served with maple syrup and fresh berries for a perfect weekend breakfast.",
    imageUrl:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    prepTime: 10,
    cookTime: 5,
    servings: 4,
    difficulty: "Easy",
    cuisine: "American",
    dietary: ["vegetarian"],
    calories: 310,
    categories: ["Quick Meals", "Budget Friendly"],
    ingredients: [
      { name: "Ripe Bananas", quantity: "3", unit: "pieces", category: "Fresh Produce", searchTerm: "bananas", perServing: 0.75 },
      { name: "Self-Raising Flour", quantity: "200g", unit: "g", category: "Pantry", searchTerm: "self raising flour", perServing: 50 },
      { name: "Free-Range Eggs", quantity: "2", unit: "pieces", category: "Dairy", searchTerm: "eggs", perServing: 0.5 },
      { name: "Milk", quantity: "150ml", unit: "ml", category: "Dairy", searchTerm: "milk", perServing: 37.5 },
      { name: "Maple Syrup", quantity: "4 tbsp", unit: "tbsp", category: "Pantry", searchTerm: "maple syrup", perServing: 1 },
      { name: "Butter", quantity: "30g", unit: "g", category: "Dairy", searchTerm: "butter", perServing: 7.5 },
      { name: "Mixed Berries", quantity: "200g", unit: "g", category: "Fresh Produce", searchTerm: "mixed berries", optional: true, perServing: 50 },
    ],
    steps: [
      "Mash bananas in a large bowl until smooth.",
      "Add flour, eggs and milk. Whisk until you have a smooth, thick batter.",
      "Heat a knob of butter in a non-stick frying pan over medium heat.",
      "Ladle small amounts of batter into the pan to form pancakes.",
      "Cook for 2 minutes until bubbles appear, then flip and cook 1-2 minutes more.",
      "Repeat with remaining batter, keeping cooked pancakes warm.",
      "Stack pancakes, drizzle with maple syrup and top with fresh berries.",
    ],
    tips: [
      "The riper the bananas, the sweeter the pancakes.",
      "Add a pinch of cinnamon to the batter for extra warmth.",
    ],
    author: "UK Grocery Kitchen",
  },
]

export function findRecipeBySlug(slug: string): Recipe | undefined {
  return RECIPES.find((recipe) => recipe.slug === slug)
}

export function filterRecipes(params: {
  category?: string
  dietary?: string
  cuisine?: string
  search?: string
}): Recipe[] {
  let filtered = [...RECIPES]

  if (params.category) {
    const cat = params.category.toLowerCase()
    filtered = filtered.filter((r) =>
      r.categories.some((c) => c.toLowerCase() === cat),
    )
  }

  if (params.dietary) {
    const diet = params.dietary.toLowerCase()
    filtered = filtered.filter((r) =>
      r.dietary.some((d) => d.toLowerCase() === diet),
    )
  }

  if (params.cuisine) {
    const cuisine = params.cuisine.toLowerCase()
    filtered = filtered.filter(
      (r) => r.cuisine.toLowerCase() === cuisine,
    )
  }

  if (params.search) {
    const term = params.search.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(term)),
    )
  }

  return filtered
}
