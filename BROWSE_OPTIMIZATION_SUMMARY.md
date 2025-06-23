# Browse Page Infinite Scroll Optimization

## Overview
This document summarizes the optimizations made to the Browse Chunks page to improve performance by implementing progressive loading instead of loading all chunks at once.

## Changes Made

### 1. **useChunks Hook Enhancement**
- Added an `append` parameter to the `getChunks` function to support appending new chunks to existing data
- Modified the caching strategy to only cache the initial 50 chunks
- Prevented the loading state from being triggered during append operations

### 2. **Browse Page Pagination Implementation**

#### Initial Load Strategy
- Changed from loading 1000 chunks to loading only **50 chunks initially**
- This provides a much faster initial page load time

#### Progressive Loading
- Loads **200 additional chunks** each time the user scrolls near the bottom
- Fetches chunks progressively from the API instead of loading everything upfront
- Tracks the current offset in the API to know where to fetch from next

#### State Management
- Added `currentOffset` to track how many chunks have been loaded from the API
- Added `hasMoreInAPI` to know if there are more chunks available in the database
- Separated display pagination (`displayLimit`, `hasMoreToDisplay`) from API pagination
- This allows smooth scrolling through filtered results while loading more data as needed

### 3. **Smart Loading Logic**
The implementation includes intelligent loading that:
- Loads more chunks from the API when the user is within 40 items of the end of loaded chunks
- Continues to paginate through filtered results smoothly
- Prevents unnecessary API calls when sufficient chunks are already loaded

## Performance Benefits

1. **Initial Load Time**: Reduced from loading 1000 chunks to just 50 chunks (95% reduction)
2. **Memory Usage**: Only keeps necessary chunks in memory, loading more as needed
3. **User Experience**: Smooth scrolling with progressive loading indicators
4. **Network Efficiency**: Smaller payload sizes with incremental loading

## How It Works

1. **Initial Page Load**:
   - Fetches 50 chunks from the API
   - Displays first 20 chunks to the user
   - Sets up infinite scroll observer

2. **User Scrolls Down**:
   - When user approaches the bottom, the display limit increases by 20
   - If approaching the end of loaded chunks, fetches 200 more from the API
   - Updates the UI smoothly without interrupting the scroll

3. **Filtering**:
   - Filters are applied to all loaded chunks
   - Display pagination resets when filters change
   - API continues loading more chunks as needed for filtered results

## API Parameters

The backend API already supported pagination:
- `skip`: Number of documents to skip
- `limit`: Maximum number of documents to return

Example API calls:
- Initial load: `/api/v1/chunks?skip=0&limit=50`
- Load more: `/api/v1/chunks?skip=50&limit=200`
- Next batch: `/api/v1/chunks?skip=250&limit=200`

## Future Enhancements

1. **Virtual Scrolling**: For even better performance with very large datasets
2. **Prefetching**: Load the next batch before the user reaches the bottom
3. **Cache Management**: Implement a sliding window to release chunks that are far from the current viewport
4. **Search Integration**: Add server-side filtering for text search to reduce client-side processing