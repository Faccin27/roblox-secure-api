local Players = game:GetService("Players")
local USERNAME = "{{USERNAME}}"
local KEY_NAME = "{{KEY_NAME}}"
local player = Players:FindFirstChild(USERNAME)
if player then
    player:SetAttribute("SecureValidated", true)
    player:SetAttribute("SecureKeyName", KEY_NAME)
end
