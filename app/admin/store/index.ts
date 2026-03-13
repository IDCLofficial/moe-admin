import { configureStore } from '@reduxjs/toolkit'
import { schoolsApi } from './api/schoolsApi'
import { systemApi } from './api/systemApi'

export const store = configureStore({
  reducer: {
    [schoolsApi.reducerPath]: schoolsApi.reducer,
    [systemApi.reducerPath]: systemApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(schoolsApi.middleware).concat(systemApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
