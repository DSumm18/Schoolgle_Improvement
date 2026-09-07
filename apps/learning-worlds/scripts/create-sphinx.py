"""Original sandstone sphinx for Nile Quest. No downloaded textures or meshes.
Blender -Y is forward; the exported glTF faces +Z, stands on Y=0,
and has final bounds 4 wide x 8 long x 5 high world units.
"""
import bpy, math, os, json
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','models');os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
parts=[]
def material(name,colour):
    m=bpy.data.materials.new(name);m.diffuse_color=(*colour,1);m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*colour,1);shader.inputs['Roughness'].default_value=.91
    return m
stone=material('Sun-warmed sandstone',(.66,.43,.21))
light=material('Carved sandstone edges',(.76,.54,.29))
band=material('Weathered recessed bands',(.49,.32,.16))
incision=material('Deep carved details',(.28,.19,.10))
def sphere(name,loc,scale,mat=stone,segments=24,rings=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
    obj=bpy.context.object;obj.name=name;obj.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    for face in obj.data.polygons:face.use_smooth=True
    parts.append(obj);return obj
def cube(name,loc,scale,mat=stone,bevel=.07):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);obj=bpy.context.object;obj.name=name;obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Worn stone edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
        normal=obj.modifiers.new('Weighted face normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=normal.name)
    parts.append(obj);return obj
def polygon(name,verts,faces,mat=stone):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat);parts.append(obj);return obj
def tube(name,points,r,mat=stone):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=2;data.bevel_depth=r;data.bevel_resolution=2
    poly=data.splines.new('POLY');poly.points.add(len(points)-1)
    for p,v in zip(poly.points,points):p.co=(*v,1)
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.convert(target='MESH');obj=bpy.context.object;parts.append(obj);obj.select_set(False);return obj

# A broad, recumbent lion with weight through its chest and extended forepaws.
cube('Sandstone foundation',(0,-.05,.17),(4.1,8.35,.34),stone,.12)
cube('Foundation chamfer',(0,-.05,.36),(3.88,8.10,.14),light,.06)
sphere('Lion torso',(0,.65,1.32),(1.19,2.45,.99))
sphere('Powerful chest',(0,-1.48,1.66),(1.04,1.15,1.35))
sphere('Upright neck',(0,-1.68,2.73),(.70,.72,1.09))
for side in [-1,1]:
    sphere('Resting hind haunch',(side*1.0,2.10,1.05),(.70,1.14,.72))
    sphere('Folded hind leg',(side*1.06,2.66,.67),(.58,.78,.30))
    sphere('Lion shoulder',(side*.76,-1.28,1.43),(.47,.87,.82))
    sphere('Extended foreleg',(side*.76,-2.42,.72),(.39,1.28,.37))
    sphere('Front paw',(side*.76,-3.40,.64),(.51,.60,.25))
    for toe in [-1,0,1]:
        sphere('Paw toe',(side*.76+toe*.20,-3.69,.58),(.155,.31,.155),light,16,10)
    for toe in [-.10,.10]:
        tube('Paw groove',[(side*.76+toe,-3.97,.61),(side*.76+toe,-3.63,.75)],.014,band)
# Tail follows the rear flank and curls to a rounded tuft.
tail=[]
for i in range(25):
    u=i/24;angle=-.9+u*3.3
    tail.append((.75+math.sin(angle)*.85,2.34+math.cos(angle)*1.04,.61+.11*math.sin(u*math.pi)))
tube('Curled lion tail',tail,.095,stone);sphere('Tail tuft',tail[-1],(.20,.22,.14),light,16,10)

# Human royal face: broad jaw, brow and lips, with a deliberately weathered nose.
sphere('Royal head',(0,-1.89,3.94),(.70,.65,.91),stone,28,18)
cube('Royal jaw',(0,-2.02,3.40),(1.06,.81,.49),stone,.20)
sphere('Left cheek',(-.40,-2.39,3.83),(.28,.16,.35),light)
sphere('Right cheek',(.40,-2.39,3.83),(.28,.16,.35),light)
for side in [-1,1]:
    sphere('Carved eye socket',(side*.29,-2.484,4.11),(.224,.043,.097),band,20,12)
    sphere('Stone eye',(side*.29,-2.511,4.12),(.167,.028,.043),light,20,10)
    tube('Royal brow',[(side*.08,-2.52,4.27),(side*.26,-2.54,4.30),(side*.46,-2.49,4.26)],.044,stone)
    sphere('Ear',(side*.68,-1.89,4.02),(.12,.13,.23),light,20,12)
# Angular bridge and broken asymmetric tip communicate stone damage without a wound.
polygon('Weathered nose', [(-.12,-2.43,4.25),(.12,-2.43,4.25),(-.13,-2.56,3.87),(.13,-2.56,3.87),(-.095,-2.65,3.98),(.105,-2.61,4.07)],[(0,1,5,4),(0,4,2),(1,3,5),(2,4,5,3),(0,2,3,1)],light)
sphere('Upper lip',(0,-2.49,3.64),(.30,.065,.064),stone,24,12)
sphere('Lower lip',(0,-2.49,3.57),(.27,.055,.056),light,24,12)
tube('Mouth incision',[(-.24,-2.543,3.625),(0,-2.558,3.608),(.24,-2.543,3.625)],.014,incision)
sphere('Chin',(0,-2.34,3.39),(.40,.21,.20),stone)

# The nemes is a flared cloth form carved from sandstone, with striped lappets.
sphere('Nemes crown',(0,-1.80,4.48),(.84,.76,.63),stone,28,18)
# Crest band across the forehead and small stylised uraeus motif.
tube('Royal forehead band',[(-.68,-2.30,4.48),(-.38,-2.50,4.58),(0,-2.57,4.61),(.38,-2.50,4.58),(.68,-2.30,4.48)],.085,light)
sphere('Royal cobra crest',(0,-2.57,4.65),(.080,.090,.17),light,16,10)
for side in [-1,1]:
    # Four corners of the front panel, with a thick rear profile.
    front=[(side*.58,-2.23,4.64),(side*1.22,-1.88,4.34),(side*1.40,-1.78,2.94),(side*.64,-2.16,2.67)]
    back=[(x,y+.34,z) for x,y,z in front]
    polygon('Flared nemes lappet',front+back,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],stone)
    for i in range(10):
        u=.05+i*.09;v=u+.037
        def edge(t,left):
            a=Vector(front[0 if left else 1]);b=Vector(front[3 if left else 2]);q=a.lerp(b,t);q.y-=.012;return tuple(q)
        polygon('Incised nemes stripe',[edge(u,True),edge(u,False),edge(v,False),edge(v,True)],[(0,1,2,3)],band)
# Close-spaced stripes follow the curve over the head rather than using textures.
for i in range(9):
    y=-2.24+i*.11
    width=.80*math.sqrt(max(.15,1-((y+1.8)/.79)**2))
    pts=[]
    for j in range(17):
        x=-width+2*width*j/16
        z=4.48+.637*math.sqrt(max(0,1-(x/.845)**2-((y+1.8)/.77)**2))
        pts.append((x,y,z))
    tube('Crown stripe',pts,.024,band)
# Small shallow fractures make the prop read as carved, weathered stone.
tube('Chest weathering',[(-.36,-2.26,2.69),(-.30,-2.34,2.52),(-.38,-2.38,2.39)],.014,band)
tube('Base fracture',[(1.48,-4.227,.26),(1.37,-4.227,.20),(1.44,-4.227,.10)],.016,band)

# One mesh, four materials, no textures. Bake exact placement dimensions.
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:obj.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();sphinx=bpy.context.object;sphinx.name='NileSphinx'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
points=[v.co for v in sphinx.data.vertices]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
scale=Vector((4/(hi.x-lo.x),8/(hi.y-lo.y),5/(hi.z-lo.z)))
for v in sphinx.data.vertices:
    v.co.x=(v.co.x-(hi.x+lo.x)/2)*scale.x
    v.co.y=(v.co.y-(hi.y+lo.y)/2)*scale.y
    v.co.z=(v.co.z-lo.z)*scale.z
sphinx.data.update();sphinx.data.calc_loop_triangles()
triangles=len(sphinx.data.loop_triangles)
assert triangles<35000,triangles
sphinx['asset']='Original stylised royal sphinx; fictional game sculpture'
sphinx['dimensions_gltf']=[4,5,8]
sphinx['forward_axis']='glTF +Z'
sphinx['ground_y']=0
sphinx['triangles']=triangles
bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'sphinx.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)

# Review studio is saved in Blender but is not exported with the game model.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.28,.28,.28)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));bpy.context.object.name='Review floor'
floor=material('Review floor material',(.15,.19,.17));bpy.context.object.data.materials.append(floor)
def area(name,location,power,size,colour):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.size=size;data.color=colour;obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=location;obj.rotation_euler=(Vector((0,0,2))-obj.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(-5,-8,12),1500,7,(1,.82,.60));area('Sky fill',(6,-3,8),900,6,(.65,.82,1));area('Rim',(2,6,10),1700,5,(1,.75,.43))
camdata=bpy.data.cameras.new('Sphinx review camera');camera=bpy.data.objects.new('Sphinx review camera',camdata);scene.collection.objects.link(camera)
camera.location=(10,-13,8);camera.rotation_euler=(Vector((0,-.25,2.0))-camera.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=10.8;scene.camera=camera
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,'assets','sphinx-review.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'assets','nile-sphinx.blend'))
bpy.ops.render.render(write_still=True)
print('SPHINX_METADATA',json.dumps({'dimensions_gltf':[4,5,8],'forward':'+Z','bottom_y':0,'triangles':triangles,'materials':len(sphinx.data.materials),'file':os.path.join(OUT,'sphinx.glb')}))
