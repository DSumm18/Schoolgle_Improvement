"""Render portraits of the original game characters for their scripted mission cards."""
import bpy, os, math
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=os.path.join(root,'public','portraits');os.makedirs(out,exist_ok=True)
review = os.environ.get('NILE_REVIEW')
if review:
    for clip in ['Walk','Run','Celebrate']:
        bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'assets','nile-explorer.blend'))
        rig = next(o for o in bpy.data.objects if o.type=='ARMATURE')
        source = next(o for o in bpy.data.objects if o.type=='MESH')
        for track in rig.animation_data.nla_tracks: track.mute=True
        action=bpy.data.actions[clip]; rig.animation_data.action=action
        if action.slots: rig.animation_data.action_slot=action.slots[0]
        end=round(action.frame_range[1]); scene=bpy.context.scene
        for i,frame in enumerate([0,round(end*.25),round(end*.5),round(end*.75)]):
            scene.frame_set(frame); bpy.context.view_layer.update()
            for side in [0,1]:
                data=bpy.data.meshes.new_from_object(source.evaluated_get(bpy.context.evaluated_depsgraph_get()))
                data.transform(source.matrix_world)
                obj=bpy.data.objects.new('Pose '+str(frame)+' '+str(side),data);scene.collection.objects.link(obj)
                obj.rotation_euler.z=math.pi/2 if side else 0;obj.location.x=-7+i*4+side*1.8
        source.hide_render=True;rig.hide_render=True
        scene.render.engine='CYCLES';scene.cycles.samples=12
        scene.render.resolution_x=1600;scene.render.resolution_y=400;scene.render.resolution_percentage=100
        scene.world.color=(.35,.35,.35);scene.render.film_transparent=False
        bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.025));ground=bpy.context.object
        mat=bpy.data.materials.new('Review ground');mat.diffuse_color=(.30,.38,.33,1);ground.data.materials.append(mat)
        light=bpy.data.lights.new('Review softbox','AREA');light.energy=1900;light.size=12
        lamp=bpy.data.objects.new('Review softbox',light);scene.collection.objects.link(lamp);lamp.location=(0,-5,8)
        lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
        camdata=bpy.data.cameras.new('Review camera');camera=bpy.data.objects.new('Review camera',camdata);scene.collection.objects.link(camera)
        camera.location=(0,-16,4);camera.rotation_euler=(Vector((0,0,1.1))-camera.location).to_track_quat('-Z','Y').to_euler()
        camdata.type='ORTHO';camdata.ortho_scale=17;scene.camera=camera
        scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(out,'review-'+review+'-'+clip.lower()+'.png')
        bpy.ops.render.render(write_still=True)
    raise SystemExit(0)
for role in (os.environ.get('NILE_PORTRAITS') or 'explorer,explorer-girl,farmer,scribe,archaeologist,curator').split(','):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'assets','nile-'+role+'.blend'))
    for obj in bpy.data.objects:
        if obj.type=='ARMATURE':
            obj.animation_data_clear()
            for bone in obj.pose.bones:
                bone.rotation_euler=(0,0,0);bone.location=(0,0,0);bone.scale=(1,1,1)
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=16
    scene.render.resolution_x=240;scene.render.resolution_y=280;scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    scene.world.color=(.45,.45,.45)
    def area(name,loc,power,size,color):
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,0,1.7))-obj.location).to_track_quat('-Z','Y').to_euler()
    area('Warm key',(-3,-4,5),450,4,(1,.90,.72))
    area('Soft fill',(3,-2,3),230,3,(.72,.90,1))
    area('Rim',(0,3,4),350,3,(1,.8,.54))
    camera_data=bpy.data.cameras.new('Portrait camera');camera=bpy.data.objects.new('Portrait camera',camera_data);scene.collection.objects.link(camera)
    camera.location=(.25,-4,2.15);camera.rotation_euler=(Vector((0,0,1.76))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.type='ORTHO';camera_data.ortho_scale=1.55;scene.camera=camera
    scene.render.image_settings.file_format='PNG'
    tones=[('warm',(.56,.30,.18)),('deep',(.24,.115,.062)),('light',(.86,.59,.39))] if role.startswith('explorer') else [('warm',(.56,.30,.18))]
    for tone,colour in tones:
        for material in bpy.data.materials:
            if material.name=='warm terracotta skin':
                material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*colour,1)
        scene.render.filepath=os.path.join(out,role+('' if tone=='warm' else '-'+tone)+'.png')
        bpy.ops.render.render(write_still=True)
    print('PORTRAIT',role)
