import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProviderInterface } from 'starknet';

interface ConnectionState {
  address: string | null;
  provider: ProviderInterface | null;
  isConnected: boolean;
}

const initialState: ConnectionState = {
  address: null,
  provider: null,
  isConnected: false
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnection: (state, action: PayloadAction<ConnectionState>) => {
      state.address = action.payload.address;
      state.provider = action.payload.provider;
      state.isConnected = action.payload.isConnected;
    },
    clearConnection: (state) => {
      state.address = null;
      state.provider = null;
      state.isConnected = false;
    }
  }
});

export const { setConnection, clearConnection } = connectionSlice.actions;
export default connectionSlice.reducer; 