import Asset from "../models/asset.model.js";

export const getSelection = async (req, res) => {
    try {
        const products = await Asset.find({ _id: { $in: req.user.selectedItems } });
        const selectionItems = products.map((product) => {
            const item = req.user.selectedItems.find((cartItem) => cartItem.id === product.id);
            return { ...product.toJSON(), quantity: item.quantity };
        });

        res.json(selectionItems);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const addToSelection = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        const existingItem = user.selectedItems.find((item) => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.selectedItems.push(productId);
        }

        await user.save();
        res.json(user.selectedItems);
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const removeAllFromSelection = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (!productId) {
            user.selectedItems = [];
        } else {
            user.selectedItems = user.selectedItems.filter((item) => item.id !== productId);
        }
        await user.save();
        res.json(user.selectedItems);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        const existingItem = user.selectedItems.find((item) => item.id === productId);

        if (existingItem) {
            if (quantity === 0) {
                user.selectedItems = user.selectedItems.filter((item) => item.id !== productId);
                await user.save();
                return res.json(user.selectedItems);
            }
            existingItem.quantity = quantity;
            await user.save();
            res.json(user.selectedItems);
        } else {
            res.status(404).json({ message: "Item not found in selection" });
        }
    } catch (error) {
                res.status(500).json({ message: "Server error", error: error.message });
    }
};