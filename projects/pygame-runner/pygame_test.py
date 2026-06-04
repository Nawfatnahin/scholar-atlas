import pygame
from sys import exit
from random import randint

def display_score():  
    current_time = int(pygame.time.get_ticks() / 1000) - start_time 
    score_surface = test_font.render(f"Score: {current_time }",False,(64,64,64))
    score_rect = score_surface.get_rect(center = (400,50))
    screen.blit(score_surface,score_rect)
    return current_time

def  obstacle_movement(obstacle_rect_list):
    if obstacle_rect_list:
        for obstacle_rect in obstacle_rect_list:
            obstacle_rect.x -= 5
            if  obstacle_rect.bottom == 300: screen.blit(snail_surface,obstacle_rect)
            else:
                screen.blit(fly_surf,obstacle_rect)
        obstacle_rect_list = [ obstacle for obstacle in obstacle_rect_list if obstacle.x > -100]   
        return obstacle_rect_list
    else: return []

def collisons(player,obstacles):
    if obstacles:
        for obstacle_rect in obstacles:
            if player.colliderect(obstacle_rect):
                return False
        
    return True


pygame.init()
pygame.display.set_caption('Runner') 

screen = pygame.display.set_mode((800, 400)) 
clock = pygame.time.Clock() 
test_font = pygame.font.Font('assets/Pixeltype.ttf', 50) 
game_active = True

sky_surface = pygame.image.load('assets/sky.png').convert() 
ground_surface = pygame.image.load('assets/ground.png').convert()

text_surface = test_font.render('My game', False , (64,64,64)) 
text_rectangle = text_surface.get_rect(center = (400,50))

# Obstacles
obstacle_rect_list = []


snail_surface = pygame.image.load('assets/snail1.png').convert_alpha()
fly_surf = pygame.image.load('assets/fly1.png').convert_alpha()

player_walk_1 = pygame.image.load('assets/player_walk_1.png').convert_alpha()
player_walk_2 = pygame.image.load('assets/player_walk_2.png').convert_alpha()
player_walk = [player_walk_1,player_walk_2]
player_jump =
player_rectangle  = player_surface.get_rect(midbottom =(80, 300))

player_gravity = 0

player_stand = pygame.image.load('assets/player_stand.png').convert_alpha()
player_stand= pygame.transform.rotozoom(player_stand,0,2) # changing orientation ,size
player_stand_rect = player_stand.get_rect(center = (400,200))

game_over_surf = test_font.render("Game Over", False, (111,196,169))
game_over_rect = game_over_surf.get_rect(center = (400,50))


game_message = test_font.render('Press space to run', False, (111,196,169))
game_message_rect = game_message.get_rect(center = (400,350))

score = 0
start_time = 0

# Timer
obstacle_timer = pygame.USEREVENT + 1 
pygame.time.set_timer(obstacle_timer,1500)

while True:                           
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            exit()
            
        if game_active:  
            if event.type == pygame.MOUSEBUTTONDOWN:  
                if player_rectangle.collidepoint(event.pos):
                    player_gravity =-20
            
            if event.type == pygame.KEYDOWN: 
                if event.key == pygame.K_SPACE and player_rectangle.bottom == 300:
                        player_gravity = -20
        
        else: 
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                game_active = True 
                
                start_time = int(pygame.time.get_ticks() / 1000) - start_time
        
        if event.type == obstacle_timer and game_active:
            if randint(0,2):
                obstacle_rect_list.append(snail_surface.get_rect(midbottom = (randint(900,1100),300)))
            else:   
                obstacle_rect_list.append(fly_surf.get_rect(midbottom = (randint(900,1100),210)))
                                      
    if game_active: 
        screen.blit(sky_surface, (0,0)) 
        screen.blit(ground_surface, (0,300))   
        
        #pygame.draw.rect(screen, '#c0e8ec', text_rectangle)
        #pygame.draw.rect(screen, '#c0e8ec', text_rectangle,10 ) 
        
        #screen.blit(text_surface, text_rectangle)
        score = display_score()       
        
        #snail_x_rectangle.left -= 4 
        #if snail_x_rectangle.left == -100: snail_x_rectangle.left = 800  
        #screen.blit(snail_surface, snail_x_rectangle)
        
        # player
        player_gravity += 1
        player_rectangle.y += player_gravity
        if player_rectangle.bottom >= 300: player_rectangle.bottom = 300
        screen.blit(player_surface, player_rectangle)
        
        # obstacle movement
        obstacle_rect_list = obstacle_movement(obstacle_rect_list)
        
        # collison 
        game_active = collisons(player_rectangle,obstacle_rect_list )

    else:
        
        screen.fill((94,129,162))
        screen.blit(player_stand,player_stand_rect)
        obstacle_rect_list.clear()
        player_rectangle.midbottom =(80,300)
        player_gravity = 0
        
        score_message = test_font.render(f"Your Score: {score}",False, (111,196,169))
        score_rect = score_message.get_rect(center= (400,330))
        
        if score == 0:
            screen.blit(game_message,game_message_rect)
            screen.blit(game_over_surf,game_over_rect)
        else:   
            screen.blit(score_message,score_rect)
        

    pygame.display.update()
    clock.tick(60) 
