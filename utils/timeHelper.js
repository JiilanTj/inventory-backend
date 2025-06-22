// Helper function to get current date in WIB
exports.getCurrentWIB = () => {
    const now = new Date();
    // Add 7 hours for WIB
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

// Convert any date to WIB
exports.convertToWIB = (date) => {
    if (!date) return null;
    return new Date(new Date(date).getTime() + (7 * 60 * 60 * 1000));
};

// Start of day in WIB
exports.getStartOfDayWIB = () => {
    const now = new Date();
    // Set to start of day UTC then add 7 hours
    now.setUTCHours(0, 0, 0, 0);
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

// End of day in WIB
exports.getEndOfDayWIB = () => {
    const now = new Date();
    // Set to end of day UTC then add 7 hours
    now.setUTCHours(23, 59, 59, 999);
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
}; 