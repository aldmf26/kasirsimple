-- Create expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'gaji', 'listrik', 'sewa', 'bahan_baku', 'lainnya'
    amount BIGINT NOT NULL CHECK (amount > 0),
    date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage expenses for their store." ON expenses
    FOR ALL
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_expenses_modtime
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
