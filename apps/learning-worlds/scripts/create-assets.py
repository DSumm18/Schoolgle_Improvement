"""Original Schoolgle explorer, rig and props. Run with Blender --background --python.
All geometry/materials created here; no third-party character assets.
"""
import bpy, math, os
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROLE = os.environ.get('NILE_CHARACTER','explorer')
OUT = os.path.join(ROOT, 'public', 'models')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(ROOT,'assets'), exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color, metallic=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=.65; bs.inputs['Metallic'].default_value=metallic
    return m
skin=mat('warm terracotta skin',(.56,.30,.18)); teal=mat('lagoon explorer jacket',(.025,.31,.31))
cream=mat('linen',(.83,.74,.54)); brown=mat('leather',(.16,.09,.052)); dark=mat('eyes',(.025,.028,.026))
hair=mat('curly dark hair',(.07,.038,.025)); gold=mat('brass',(.7,.46,.12),.6); white=mat('eye whites',(.96,.94,.87))
scarf=mat('sunset neckerchief',(.79,.22,.075)); pack=mat('canvas backpack',(.32,.36,.19))
parts=[]
def uv(name,loc,scale,material,bone='spine',segments=20,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    for p in o.data.polygons:p.use_smooth=True
    parts.append((o,bone)); return o
def capsule(name,a,b,r,material,bone):
    mid=(Vector(a)+Vector(b))/2; o=uv(name,mid,(r,r,(Vector(a)-Vector(b)).length/2+r*.55),material,bone)
    o.rotation_euler=Vector((0,0,1)).rotation_difference(Vector(b)-Vector(a)).to_euler(); return o
uv('Jacket torso',(0,0,1.34),(.31,.19,.36),teal)
uv('Linen shirt',(0,-.175,1.37),(.115,.035,.27),cream)
uv('Belt',(0,0,1.08),(.30,.195,.055),brown)
uv('Buckle',(0,-.197,1.08),(.048,.017,.039),gold)
uv('Backpack',(0,.22,1.36),(.25,.13,.27),pack)
uv('Backpack flap',(0,.32,1.53),(.24,.06,.09),cream)
for s in [-1,1]:
    uv('Shoulder strap',(s*.22,-.145,1.45),(.033,.06,.24),brown)
    uv('Jacket pocket',(s*.20,-.172,1.22),(.075,.027,.095),teal)
    capsule('Shorts',(s*.155,0,1.01),(s*.155,0,.76),.145,cream,'thigh'+str(s))
    capsule('Shin',(s*.155,0,.72),(s*.155,0,.33),.09,skin,'shin'+str(s))
    uv('Knee joint',(s*.155,0,.67),(.092,.09,.092),skin,'shin'+str(s))
    uv('Sock',(s*.155,0,.30),(.10,.10,.10),cream,'shin'+str(s))
    uv('Boot',(s*.155,-.075,.17),(.12,.19,.125),brown,'foot'+str(s))
    uv('Boot sole',(s*.155,-.075,.08),(.125,.193,.035),dark,'foot'+str(s))
    capsule('Upper sleeve',(s*.32,0,1.54),(s*.41,0,1.23),.115,teal,'arm'+str(s))
    capsule('Forearm',(s*.41,0,1.23),(s*.44,-.04,.98),.081,skin,'forearm'+str(s))
    uv('Elbow joint',(s*.41,0,1.23),(.079,.078,.079),skin,'forearm'+str(s))
    uv('Hand',(s*.44,-.055,.95),(.085,.08,.105),skin,'forearm'+str(s))
    uv('Thumb',(s*.38,-.095,.98),(.038,.040,.055),skin,'forearm'+str(s))
uv('Neck',(0,0,1.66),(.105,.10,.13),skin,'head')
uv('Head',(0,-.017,1.96),(.255,.235,.29),skin,'head',32,20)
for s in [-1,1]:
    uv('Ear',(s*.252,-.005,1.97),(.06,.05,.09),skin,'head')
    uv('Eye white',(s*.097,-.224,2.01),(.060,.022,.070),white,'head')
    uv('Iris',(s*.097,-.245,2.006),(.028,.01,.039),dark,'head')
    uv('Eye glint',(s*.088,-.254,2.026),(.009,.005,.013),white,'head')
    uv('Eyebrow',(s*.095,-.222,2.103),(.066,.026,.014),hair,'head')
uv('Nose',(0,-.255,1.956),(.047,.058,.055),skin,'head')
uv('Smile',(0,-.229,1.857),(.064,.012,.016),brown,'head')
uv('Hair cap',(0,.008,2.12),(.26,.226,.17),hair,'head')
for i in range(9):
    a=i*math.tau/9; uv('Curl',(math.cos(a)*.215,math.sin(a)*.18,2.18),(.075,.066,.068),hair,'head')
uv('Safari hat brim',(0,0,2.235),(.38,.33,.025),cream,'head',32,12)
uv('Safari hat crown',(0,.01,2.33),(.25,.23,.145),cream,'head',32,16)
uv('Hat band',(0,.008,2.267),(.254,.234,.031),brown,'head')
uv('Scarf',(0,-.01,1.66),(.16,.15,.065),scarf)
uv('Scarf knot',(0,-.17,1.62),(.055,.05,.065),scarf)
capsule('Scarf tail',(0,-.18,1.60),(.085,-.18,1.40),.035,scarf,'spine')

# Equal expedition equipment and proportions; distinct hair silhouette remains
# visible from behind the player camera and is attached to the head bone.
if ROLE == 'explorer-girl':
    uv('Ponytail tie',(.245,.16,2.10),(.095,.065,.08),scarf,'head')
    capsule('Ponytail',(.27,.16,2.10),(.32,.09,1.69),.10,hair,'head')
    uv('Ponytail tip',(.32,.075,1.66),(.08,.075,.10),hair,'head')
    for s in [-1,1]:
        capsule('Side curl',(s*.22,.05,2.05),(s*.235,.065,1.86),.045,hair,'head')

if ROLE in ['farmer', 'scribe']:
    for o,b in list(parts):
        if any(w in o.name for w in ['Safari hat','Hat band','Backpack','Shoulder strap']):
            parts.remove((o,b)); bpy.data.objects.remove(o,do_unlink=True)
    uv('Linen robe',(0,0,.95),(.32,.21,.40),cream,'root')
    uv('Broad collar',(0,-.05,1.58),(.28,.20,.07),gold)
    if ROLE=='scribe':
        teal.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.14,.20,.42,1)
        uv('Headcloth',(0,.06,2.12),(.28,.23,.19),cream,'head')
    else:
        teal.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.6,.44,.25,1)

if ROLE in ['archaeologist', 'curator']:
    for o,b in list(parts):
        if any(w in o.name for w in ['Backpack','Shoulder strap','Scarf']) or (ROLE == 'curator' and any(w in o.name for w in ['Safari hat','Hat band'])):
            parts.remove((o,b)); bpy.data.objects.remove(o,do_unlink=True)
    teal.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.48,.33,.19,1) if ROLE=='archaeologist' else (.19,.24,.43,1)
    if ROLE=='curator':
        uv('Tied hair',(0,.20,2.16),(.14,.13,.14),hair,'head')
        uv('Museum badge',(.15,-.205,1.44),(.045,.015,.063),gold)
    else:
        capsule('Brush handle',(.45,-.09,.97),(.46,-.10,.68),.025,brown,'forearm1')
        uv('Brush bristles',(.46,-.10,.63),(.055,.032,.075),cream,'forearm1')

bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0)); rig=bpy.context.object; rig.name='ExplorerRig'
bones=rig.data.edit_bones; bones.remove(bones[0])
def bone(n,a,b,parent=None):
    x=bones.new(n); x.head=a;x.tail=b
    if parent:x.parent=bones[parent]
    # Consistent local axes: X swings a limb, Z opens the arms sideways.
    x.align_roll(Vector((0,1 if n.startswith(('thigh','shin','foot','arm','forearm')) else -1,0)))
bone('root',(0,0,0),(0,0,.20)); bone('spine',(0,0,1.04),(0,0,1.66),'root');bone('head',(0,0,1.66),(0,0,2.28),'spine')
for s in [-1,1]:
    bone('thigh'+str(s),(s*.155,0,1.04),(s*.155,0,.67),'root')
    bone('shin'+str(s),(s*.155,0,.67),(s*.155,0,.23),'thigh'+str(s))
    bone('foot'+str(s),(s*.155,0,.23),(s*.155,-.18,.13),'shin'+str(s))
    bone('arm'+str(s),(s*.30,0,1.55),(s*.41,0,1.23),'spine')
    bone('forearm'+str(s),(s*.41,0,1.23),(s*.44,-.04,.95),'arm'+str(s))
bpy.ops.object.mode_set(mode='OBJECT')
for o,b in parts:
    vg=o.vertex_groups.new(name=b);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for o,b in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0][0];bpy.ops.object.join();mesh=bpy.context.object;mesh.name='NileExplorer'
mod=mesh.modifiers.new('Armature','ARMATURE');mod.object=rig;mesh.parent=rig
for p in rig.pose.bones:p.rotation_mode='XYZ'
rig.animation_data_create()
bpy.context.scene.render.fps=30
rig['asset_revision']=2
rig['walk_speed']=.84/(.58*(20/30))
rig['run_speed']=1.02/(.38*(20/30))
rig['forward_axis']='Blender -Y; glTF +Z'

def solve_leg(side,phase,running,root_height):
    # An in-place foot path: a constant-speed planted phase, then a lifted
    # recovery. The world scales playback to actual distance travelled.
    stance=.38 if running else .58
    stride=1.02 if running else .84
    lift=.31 if running else .16
    if phase < stance:
        y=-stride/2+stride*phase/stance
        z=.205
        toe=0
    else:
        u=(phase-stance)/(1-stance)
        eased=u*u*(3-2*u)
        y=stride/2-stride*eased
        z=.205+lift*math.sin(math.pi*u)**1.3
        toe=-.18*math.sin(math.pi*u)
    upper=.37;lower=.44
    down=1.04+root_height-z
    distance=min(upper+lower-.0001,max(abs(upper-lower)+.0001,math.hypot(y,down)))
    hip=math.atan2(y,down)-math.acos(max(-1,min(1,(upper*upper+distance*distance-lower*lower)/(2*upper*distance))))
    knee=math.acos(max(-1,min(1,(distance*distance-upper*upper-lower*lower)/(2*upper*lower))))
    rig.pose.bones['thigh'+str(side)].rotation_euler.x=hip
    rig.pose.bones['shin'+str(side)].rotation_euler.x=knee
    # Cancel hip/knee rotation to keep the planted sole level.
    rig.pose.bones['foot'+str(side)].rotation_euler.x=-(hip+knee)+toe

for name,frames in [('Idle',90),('Walk',20),('Run',20),('Celebrate',72)]:
    for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for f in range(frames+1):
        t=f/frames*math.tau
        for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
        if name in ['Walk','Run']:
            running=name=='Run'
            height=(-.255+.10*math.sin(t)**2) if running else (-.165+.012*(1-math.cos(2*t)))
            # Root local Y points upwards; local Z points forward.
            rig.pose.bones['root'].location.y=height
            for side in [-1,1]:
                phase=(f/frames+(0 if side==1 else .5))%1
                solve_leg(side,phase,running,height)
                swing=math.sin(t+(0 if side==1 else math.pi))
                rig.pose.bones['arm'+str(side)].rotation_euler.x=-swing*(.62 if running else .34)
                rig.pose.bones['arm'+str(side)].rotation_euler.z=-side*.055
                rig.pose.bones['forearm'+str(side)].rotation_euler.x=-(1.05 if running else .26)+swing*.10
            rig.pose.bones['spine'].rotation_euler.x=.11 if running else .025
            rig.pose.bones['spine'].rotation_euler.y=math.sin(t)*.035
            rig.pose.bones['head'].rotation_euler.x=-.055 if running else -.012
        elif name=='Idle':
            rig.pose.bones['spine'].scale=(1,1+math.sin(t)*.009,1)
            rig.pose.bones['head'].rotation_euler.z=math.sin(t)*.018
            for side in [-1,1]:rig.pose.bones['forearm'+str(side)].rotation_euler.x=-.10
        else:
            # A readable, friendly hands-up celebration. Smooth endpoint
            # easing makes this blend back to Idle without a pose snap.
            v=math.sin(math.pi*f/frames)**2
            rig.pose.bones['arm1'].rotation_euler.z=-v*2.15
            rig.pose.bones['arm-1'].rotation_euler.z=v*2.15
            rig.pose.bones['forearm1'].rotation_euler.x=-v*.45
            rig.pose.bones['forearm-1'].rotation_euler.x=-v*.45
            rig.pose.bones['root'].location.y=math.sin(t*2)**2*.12*v
            rig.pose.bones['head'].rotation_euler.x=-v*.06
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_euler',frame=f);p.keyframe_insert('location',frame=f);p.keyframe_insert('scale',frame=f)
    # Export sampled, linear tracks: no Bezier overshoot below the floor.
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                bag=strip.channelbag(slot)
                if bag:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
    track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,0,action)
    rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
bpy.context.scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'assets','nile-'+ROLE+'.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,ROLE+'.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_extras=True)
print('EXPORTED',os.path.join(OUT,ROLE+'.glb'))
