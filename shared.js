let vkInstance = null;

module.exports = {
  setVK(vk) { vkInstance = vk; },
  getVK() { return vkInstance; }
};
