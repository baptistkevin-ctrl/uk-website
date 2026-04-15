// Authentication
export { useAuth } from './use-auth'

// Utilities
export { useDebounce } from './use-debounce'

// Cart
export { useCart } from './use-cart'

// Wishlist
export { useWishlist } from './use-wishlist'

// Analytics
export { useTrackView } from './use-track-view'

// Recently Viewed
export {
  useRecentlyViewed,
  useTrackProductView,
  type RecentlyViewedProduct,
  type UseRecentlyViewedOptions,
  type UseRecentlyViewedReturn,
} from './use-recently-viewed'

// Data Fetching
export {
  useQuery,
  useFetch,
  usePaginatedQuery,
  useInfiniteQuery,
  queryCache,
  type UseQueryOptions,
  type UseQueryResult,
  type UsePaginatedQueryOptions,
  type UsePaginatedQueryResult,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
} from './use-query'

// Mutations
export {
  useMutation,
  useCustomMutation,
  useFormMutation,
  batchMutate,
  optimisticUpdate,
  rollbackOptimisticUpdate,
  type UseMutationOptions,
  type UseMutationResult,
  type UseFormMutationOptions,
  type UseFormMutationResult,
  type MutationMethod,
  type MutationState,
  type BatchMutationResult,
  type OptimisticContext,
} from './use-mutation'
